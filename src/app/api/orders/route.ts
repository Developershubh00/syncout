import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { db } from "@/db";
import { ticketedEvents, ticketTiers, users } from "@/db/schema";
import type { BookingMode } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { orderSchema } from "@/lib/validators";
import { getUser } from "@/lib/session";
import { getSettings } from "@/lib/settings";
import { quotePromo, claimPromo, releasePromo } from "@/lib/promos";
import { eventDays } from "@/lib/tevents";
import { dayLabel, rs } from "@/lib/event-format";
import { looksLikeVpa } from "@/lib/upi";
import { ticketPath } from "@/lib/access";
import { sendMail, orderReceivedEmail } from "@/lib/mail";
import { notifyUsers, later } from "@/lib/notify";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson, isUniqueViolation, rowsOf } from "@/lib/api";

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function POST(req: Request) {
  const rl = rateLimit(`order:${clientIp(req)}`, 10, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many bookings from here. Try again in a few minutes." }, { status: 429 });

  const parsed = orderSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const d = parsed.data;

  const [ev] = await db.select().from(ticketedEvents).where(eq(ticketedEvents.id, d.eventId)).limit(1);
  if (!ev || !ev.isActive) return NextResponse.json({ error: "That event is no longer listed" }, { status: 404 });
  if (!ev.salesOpen) return NextResponse.json({ error: "Bookings for this event are closed" }, { status: 409 });
  if (ev.bookingMode === "external")
    return NextResponse.json({ error: "Tickets for this one are sold by the organiser", externalUrl: ev.externalUrl }, { status: 409 });

  const days = eventDays(ev);
  const day = d.day ?? days[0];
  if (!days.includes(day)) return NextResponse.json({ error: "Pick one of the event dates" }, { status: 422 });
  const lastEntry = new Date(new Date(ev.endsAt ?? ev.startsAt).getTime());
  if (Date.now() > lastEntry.getTime()) return NextResponse.json({ error: "This event is over" }, { status: 409 });

  const [tier] = await db
    .select()
    .from(ticketTiers)
    .where(and(eq(ticketTiers.id, d.tierId), eq(ticketTiers.eventId, ev.id)))
    .limit(1);
  if (!tier || !tier.isActive) return NextResponse.json({ error: "That ticket type isn't available" }, { status: 409 });
  if (d.quantity > tier.perOrderMax)
    return NextResponse.json({ error: `Up to ${tier.perOrderMax} per booking for this ticket` }, { status: 422 });
  if (tier.salesStartAt && tier.salesStartAt.getTime() > Date.now())
    return NextResponse.json({ error: `${tier.name} isn't on sale yet` }, { status: 409 });
  if (tier.salesEndAt && tier.salesEndAt.getTime() <= Date.now())
    return NextResponse.json({ error: `${tier.name} sales have ended — pick another ticket` }, { status: 409 });

  const user = await getUser();
  if (user) {
    const [u] = await db.select({ blocked: users.isBlocked }).from(users).where(eq(users.id, user.id)).limit(1);
    if (u?.blocked) return NextResponse.json({ error: "This account is on hold. Contact support." }, { status: 403 });
  }

  const settings = await getSettings();
  const subtotal = tier.price * d.quantity;
  let discount = 0;
  let promo: { id: string; code: string } | null = null;
  if (d.promoCode) {
    const q = await quotePromo(d.promoCode, { eventId: ev.id, subtotal, quantity: d.quantity });
    if (!q.ok) return NextResponse.json({ error: q.error }, { status: 422 });
    if (!(await claimPromo(q.id))) return NextResponse.json({ error: "That code was just used up" }, { status: 409 });
    discount = q.discount;
    promo = { id: q.id, code: q.code };
  }
  const amount = subtotal - discount;
  let mode: BookingMode = ev.bookingMode;
  if (amount === 0) mode = "free";
  else if (mode === "upi" && !looksLikeVpa(settings.upiVpa) && !settings.upiQrImage) mode = "whatsapp";
  const status = mode === "free" ? "payment_submitted" : "awaiting_payment";

  // Tickets per day are checked inside the insert, counting paid tickets and
  // unpaid ones still inside their hold window.
  let row: { id: string; code: string } | undefined;
  for (let attempt = 0; attempt < 3 && !row; attempt++) {
    const code = "T" + makeCode();
    try {
      const res = await db.execute(sql`
        insert into ticket_orders (
          code, event_id, tier_id, user_id, day, tier_name, quantity, admits, unit_price, amount,
          name, phone, email, status, mode, note, subtotal, discount, promo_code
        )
        select
          ${code}, ${ev.id}::uuid, ${tier.id}::uuid, ${user?.id ?? null}::uuid, ${day}, ${tier.name},
          ${d.quantity}::int, ${d.quantity * tier.admits}::int, ${tier.price}::int, ${amount}::int,
          ${d.name.trim()}, ${d.phone}, ${d.email.toLowerCase()}, ${status}, ${mode}, ${d.note || null},
          ${subtotal}::int, ${discount}::int, ${promo?.code ?? null}
        where ${tier.capacity}::int is null or (
          select coalesce(sum(quantity), 0) from ticket_orders
          where tier_id = ${tier.id}::uuid and coalesce(day, '') = ${day}
            and (
              status in ('payment_submitted', 'confirmed', 'checked_in')
              or (status = 'awaiting_payment' and created_at > now() - make_interval(hours => ${settings.orderHoldHours}::int))
            )
        ) + ${d.quantity}::int <= ${tier.capacity}::int
        returning id, code
      `);
      row = rowsOf<{ id: string; code: string }>(res)[0];
      if (!row) {
        if (promo) await releasePromo(promo.id);
        return NextResponse.json({ error: "Sold out for that date — try another ticket or date" }, { status: 409 });
      }
    } catch (e) {
      if (isUniqueViolation(e, "ticket_orders_code_unique")) continue;
      if (promo) await releasePromo(promo.id);
      throw e;
    }
  }
  if (!row) {
    if (promo) await releasePromo(promo.id);
    return NextResponse.json({ error: "Couldn't save that — please try again" }, { status: 500 });
  }

  const saved = row;
  const url = ticketPath(saved.code);
  const tickets = `${d.quantity} × ${tier.name}`;

  if (user) {
    await notifyUsers([user.id], {
      kind: "receipt",
      title: mode === "free" ? "Booking requested" : "Booking requested — complete payment",
      body: `${ev.title} · ${dayLabel(day)} · ${tickets}`,
      url,
      popup: false,
    }).catch(() => {});
  }

  later(() =>
    sendMail({
      to: d.email,
      subject: `Booking ${saved.code} — ${ev.title}`,
      html: orderReceivedEmail({
        name: d.name,
        event: ev.title,
        venue: ev.venueName,
        date: dayLabel(day),
        code: saved.code,
        tickets,
        amount: rs(amount),
        url,
        free: mode === "free",
      }),
    })
  );

  return NextResponse.json({ ok: true, code: saved.code, url, mode }, { status: 201 });
}

import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";
import { db } from "@/db";
import { bookings, clubs, events, users } from "@/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import { bookingSchema } from "@/lib/validators";
import { guestlistWindow } from "@/lib/guestlist";
import { getUser } from "@/lib/session";
import { accountForCheckout, emailBlocked } from "@/lib/auto-account";
import { alertAdmins } from "@/lib/admin-alerts";
import { qrSvg } from "@/lib/upi";
import { absUrl } from "@/lib/site";
import { sendMail, guestlistReceivedEmail } from "@/lib/mail";
import { friendlyDate } from "@/lib/utils";
import { passPath } from "@/lib/access";
import { notifyUsers, later } from "@/lib/notify";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson, isUniqueViolation, rowsOf } from "@/lib/api";

const makeCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

export async function POST(req: Request) {
  const rl = rateLimit(`book:${clientIp(req)}`, 12, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });

  const parsed = bookingSchema.safeParse(await readJson(req));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form and try again" }, { status: 422 });
  }
  const d = parsed.data;

  const [hit] = await db
    .select({ ev: events, clubName: clubs.name, clubActive: clubs.isActive })
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .where(eq(events.id, d.eventId))
    .limit(1);
  if (!hit || !hit.ev.isActive || !hit.clubActive) {
    return NextResponse.json({ error: "That night is no longer listed" }, { status: 404 });
  }
  const night = hit.ev;

  const win = guestlistWindow(new Date(night.startsAt), night.guestlistOpen, night.cutoffHour);
  if (!win.open) return NextResponse.json({ error: win.message }, { status: 409 });

  /* ── head-count rules ── */
  const total = d.femaleCount + d.maleCount;
  if (total < 1) return NextResponse.json({ error: "Add at least one guest" }, { status: 422 });
  if (d.entryType === "group") return NextResponse.json({ error: "Pick girls, couple or guys" }, { status: 422 });
  if (d.entryType === "couple" && (d.femaleCount < 1 || d.femaleCount !== d.maleCount || d.femaleCount > 4)) {
    // Couples come in pairs — this is what stops "1 girl + 4 guys" using the
    // couples list, including on nights when the guys' list is shut.
    return NextResponse.json({ error: "Couples apply in pairs — up to 4 couples" }, { status: 422 });
  }
  if (d.entryType === "stag_female" && (d.maleCount > 0 || d.femaleCount > 5))
    return NextResponse.json({ error: "The girls' list takes up to 5 — pick couple to bring guys" }, { status: 422 });
  if (d.entryType === "stag_male" && (d.femaleCount > 0 || d.maleCount > 3))
    return NextResponse.json({ error: "The guys' list takes up to 3 per application" }, { status: 422 });

  const enabled =
    (d.entryType === "stag_female" && night.femaleEnabled) ||
    (d.entryType === "couple" && night.coupleEnabled) ||
    (d.entryType === "stag_male" && night.maleEnabled);
  if (!enabled) return NextResponse.json({ error: "That list is closed for this night" }, { status: 409 });

  /* ── who's applying ── */
  const user = await getUser();
  if (user) {
    const [u] = await db.select({ blocked: users.isBlocked }).from(users).where(eq(users.id, user.id)).limit(1);
    if (u?.blocked) return NextResponse.json({ error: "This account is on hold. Contact support." }, { status: 403 });
  } else if (await emailBlocked(d.guestEmail)) {
    return NextResponse.json({ error: "This account is on hold. Contact support." }, { status: 403 });
  }

  const phone = d.guestPhone.trim();
  const [dupe] = await db
    .select({ code: bookings.code })
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, night.id),
        inArray(bookings.status, ["pending", "approved", "checked_in", "waitlisted"]),
        user ? or(eq(bookings.guestPhone, phone), eq(bookings.userId, user.id)) : eq(bookings.guestPhone, phone)
      )
    )
    .limit(1);
  if (dupe) {
    return NextResponse.json({ error: "You've already applied for this night — check Passes for its status." }, { status: 409 });
  }

  const limit =
    d.entryType === "stag_female" ? night.femaleLimit : d.entryType === "couple" ? night.coupleLimit : night.maleLimit;
  const price =
    d.entryType === "stag_female" ? night.femalePrice : d.entryType === "couple" ? night.couplePrice : night.malePrice;
  const amount = price * (d.entryType === "couple" ? d.femaleCount : total);

  // Capacity is checked inside the insert itself, so the count and the write
  // can't drift apart the way a separate read-then-insert can.
  let row: { id: string; code: string } | undefined;
  for (let attempt = 0; attempt < 3 && !row; attempt++) {
    const code = makeCode();
    try {
      const res = await db.execute(sql`
        insert into bookings (
          code, user_id, event_id, club_id, entry_type, female_count, male_count, total_guests,
          guest_name, guest_phone, guest_email, guest_instagram, arrival_time, notes, companions,
          amount, status
        )
        select
          ${code}, ${user?.id ?? null}::uuid, ${night.id}::uuid, ${night.clubId}::uuid, ${d.entryType}::entry_type,
          ${d.femaleCount}::int, ${d.maleCount}::int, ${total}::int,
          ${d.guestName.trim()}, ${phone}, ${d.guestEmail.trim().toLowerCase()}, ${d.guestInstagram || null},
          ${d.arrivalTime}, ${d.notes || null}, ${JSON.stringify(d.companions)}::jsonb,
          ${amount}::int, 'pending'::booking_status
        where (
          select coalesce(sum(total_guests), 0) from bookings
          where event_id = ${night.id}::uuid
            and entry_type = ${d.entryType}::entry_type
            and status in ('pending', 'approved', 'checked_in')
        ) + ${total}::int <= ${limit}::int
        returning id, code
      `);
      row = rowsOf<{ id: string; code: string }>(res)[0];
      if (!row) {
        const [{ taken }] = rowsOf<{ taken: number | string }>(
          await db.execute(sql`
            select coalesce(sum(total_guests), 0) as taken from bookings
            where event_id = ${night.id}::uuid and entry_type = ${d.entryType}::entry_type
              and status in ('pending', 'approved', 'checked_in')`)
        );
        const left = Math.max(0, limit - Number(taken));
        return NextResponse.json(
          { error: left > 0 ? `Only ${left} spots left on this list` : "This list is full for tonight" },
          { status: 409 }
        );
      }
    } catch (e) {
      if (isUniqueViolation(e, "bookings_code_unique")) continue; // code collision — roll another
      throw e;
    }
  }
  if (!row) return NextResponse.json({ error: "Couldn't save that — please try again" }, { status: 500 });

  const url = passPath(row.code);
  const saved = row;

  const acct = await accountForCheckout(user, { name: d.guestName, email: d.guestEmail, phone }).catch(() => ({ userId: null, account: null }));
  if (!user && acct.userId) await db.execute(sql`update bookings set user_id = ${acct.userId}::uuid where id = ${saved.id}::uuid`);

  later(() =>
    alertAdmins({
      title: "New guestlist request",
      body: `${night.title} at ${hit.clubName} — ${d.guestName.trim()}, ${d.femaleCount + d.maleCount} people`,
      url: "/admin/bookings?status=pending",
      tag: saved.code,
    })
  );

  if (acct.userId) {
    await notifyUsers([acct.userId], {
      kind: "receipt",
      title: "Guestlist request sent",
      body: `${night.title} at ${hit.clubName}. We confirm by 6 PM.`,
      url,
      popup: false,
    }).catch(() => {});
  }

  later(() =>
    sendMail({
      to: d.guestEmail,
      subject: `Guestlist request received — ${night.title}`,
      html: guestlistReceivedEmail({
        name: d.guestName,
        event: night.title,
        club: hit.clubName,
        date: friendlyDate(night.startsAt),
        code: saved.code,
        url,
      }),
    })
  );

  const qr = await qrSvg(absUrl(`/door?code=${saved.code}`));
  return NextResponse.json({ ok: true, code: saved.code, id: saved.id, url, account: acct.account, qr }, { status: 201 });
}

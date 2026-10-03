import { NextResponse } from "next/server";
import { db } from "@/db";
import { ticketOrders, ticketedEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { adminOrderPatchSchema } from "@/lib/validators";
import { readJson, fail, guard } from "@/lib/api";
import { notifyUsers, later } from "@/lib/notify";
import { sendMail, orderConfirmedEmail, orderRejectedEmail } from "@/lib/mail";
import { ticketPath } from "@/lib/access";
import { dayLabel } from "@/lib/event-format";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  const admin = await getAdmin();
  if (!admin) return fail("Unauthorized", 401);
  const { id } = await params;
  const parsed = adminOrderPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { status, adminNote, reason } = parsed.data;

  const [row] = await db
    .select({ o: ticketOrders, title: ticketedEvents.title, venue: ticketedEvents.venueName })
    .from(ticketOrders)
    .innerJoin(ticketedEvents, eq(ticketOrders.eventId, ticketedEvents.id))
    .where(eq(ticketOrders.id, id))
    .limit(1);
  if (!row) return fail("Booking not found", 404);
  const o = row.o;

  await db
    .update(ticketOrders)
    .set({
      ...(adminNote !== undefined ? { adminNote: adminNote || null } : {}),
      ...(status
        ? {
            status,
            reviewedBy: admin.via === "key" ? "admin (key)" : "admin",
            ...(status === "confirmed" && !o.confirmedAt ? { confirmedAt: new Date() } : {}),
            ...(status === "checked_in" ? { checkedInAt: new Date(), confirmedAt: o.confirmedAt ?? new Date() } : {}),
          }
        : {}),
    })
    .where(eq(ticketOrders.id, id));

  if (status && status !== o.status) {
    const url = ticketPath(o.code);
    const when = o.day ? dayLabel(o.day) : "";
    const tickets = `${o.quantity} × ${o.tierName}`;

    if (status === "confirmed") {
      await notifyUsers([o.userId], {
        kind: "confirmed",
        title: "Tickets confirmed",
        body: `${row.title}${when ? ` · ${when}` : ""} · ${tickets}. Show ${o.code} at the entry.`,
        url,
      });
      later(() =>
        sendMail({
          to: o.email,
          subject: `Confirmed: ${row.title} — ${o.code}`,
          html: orderConfirmedEmail({ name: o.name, event: row.title, venue: row.venue, date: when, code: o.code, tickets, url }),
        })
      );
    } else if (status === "rejected") {
      const why = reason || "We couldn't verify the payment. If you've paid, message us on WhatsApp with the screenshot.";
      await notifyUsers([o.userId], { kind: "rejected", title: "Booking not confirmed", body: `${row.title}: ${why}`, url });
      later(() =>
        sendMail({
          to: o.email,
          subject: `Booking ${o.code} — not confirmed`,
          html: orderRejectedEmail({ name: o.name, event: row.title, code: o.code, reason: why, url }),
        })
      );
    } else if (status === "cancelled" || status === "refunded") {
      await notifyUsers([o.userId], {
        kind: "info",
        title: status === "refunded" ? "Booking refunded" : "Booking cancelled",
        body: `${row.title} · ${o.code}`,
        url,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(ticketOrders).where(eq(ticketOrders.id, (await params).id));
  return NextResponse.json({ ok: true });
}

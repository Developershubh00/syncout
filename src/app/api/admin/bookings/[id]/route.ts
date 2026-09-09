import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { sendMail, guestlistApprovedEmail, guestlistRejectedEmail } from "@/lib/mail";
import { friendlyDate } from "@/lib/utils";

const ALLOWED = ["pending", "approved", "rejected", "waitlisted", "checked_in", "no_show", "cancelled"] as const;
type Status = (typeof ALLOWED)[number];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: Status; reason?: string };
  if (!body.status || !ALLOWED.includes(body.status))
    return NextResponse.json({ error: "Unknown status" }, { status: 422 });

  const [row] = await db
    .select({
      b: bookings,
      eventTitle: events.title,
      startsAt: events.startsAt,
      clubName: clubs.name,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  await db
    .update(bookings)
    .set({
      status: body.status,
      rejectionReason: body.status === "rejected" ? body.reason ?? null : null,
      reviewedAt: new Date(),
      reviewedBy: "admin",
      checkedInAt: body.status === "checked_in" ? new Date() : row.b.checkedInAt,
    })
    .where(eq(bookings.id, id));

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";

  if (body.status === "approved") {
    await sendMail({
      to: row.b.guestEmail,
      subject: `You're on the list — ${row.eventTitle}`,
      html: guestlistApprovedEmail({
        name: row.b.guestName,
        event: row.eventTitle,
        club: row.clubName,
        date: friendlyDate(row.startsAt),
        code: row.b.code,
        guests: row.b.totalGuests,
        url: `${base}/passes/${row.b.code}`,
      }),
    });
    await db.update(bookings).set({ emailSentAt: new Date() }).where(eq(bookings.id, id));
  }

  if (body.status === "rejected") {
    await sendMail({
      to: row.b.guestEmail,
      subject: `Guestlist update — ${row.eventTitle}`,
      html: guestlistRejectedEmail({
        name: row.b.guestName,
        event: row.eventTitle,
        reason: body.reason,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.delete(bookings).where(eq(bookings.id, (await params).id));
  return NextResponse.json({ ok: true });
}

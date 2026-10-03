import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { adminBookingPatchSchema } from "@/lib/validators";
import { readJson, fail, guard } from "@/lib/api";
import { announceGuestlistDecision } from "@/lib/decisions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  const admin = await getAdmin();
  if (!admin) return fail("Unauthorized", 401);

  const { id } = await params;
  const parsed = adminBookingPatchSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Unknown status", 422);
  const { status, reason } = parsed.data;

  const [row] = await db
    .select({ b: bookings, eventTitle: events.title, startsAt: events.startsAt, clubName: clubs.name })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) return fail("Booking not found", 404);

  const finalReason = status === "rejected" ? reason || "The list filled up for this night." : null;
  await db
    .update(bookings)
    .set({
      status,
      rejectionReason: finalReason,
      reviewedAt: new Date(),
      reviewedBy: admin.via === "key" ? "admin (key)" : "admin",
      checkedInAt: status === "checked_in" ? new Date() : row.b.checkedInAt,
    })
    .where(eq(bookings.id, id));

  // Only tell the guest when something actually changed.
  if (status !== row.b.status) {
    await announceGuestlistDecision(
      [{ ...row.b, eventTitle: row.eventTitle, startsAt: row.startsAt, clubName: row.clubName }],
      status,
      finalReason
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(bookings).where(eq(bookings.id, (await params).id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { readJson, fail, guard } from "@/lib/api";
import { announceGuestlistDecision } from "@/lib/decisions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(200),
  status: z.enum(["approved", "rejected", "waitlisted"]),
  reason: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const admin = await getAdmin();
  if (!admin) return fail("Unauthorized", 401);

  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { ids, status, reason } = parsed.data;

  const finalReason = status === "rejected" ? reason || "The list filled up for this night." : null;

  // Only rows still pending — a guest checked in at the door a minute ago
  // must not be flipped back to "approved" by a stale page.
  const updated = await db
    .update(bookings)
    .set({ status, reviewedAt: new Date(), reviewedBy: admin.via === "key" ? "admin (key)" : "admin", rejectionReason: finalReason })
    .where(and(inArray(bookings.id, ids), eq(bookings.status, "pending")))
    .returning({ id: bookings.id });

  if (updated.length) {
    const rows = await db
      .select({
        id: bookings.id,
        code: bookings.code,
        userId: bookings.userId,
        guestName: bookings.guestName,
        guestEmail: bookings.guestEmail,
        totalGuests: bookings.totalGuests,
        eventTitle: events.title,
        startsAt: events.startsAt,
        clubName: clubs.name,
      })
      .from(bookings)
      .innerJoin(events, eq(bookings.eventId, events.id))
      .innerJoin(clubs, eq(bookings.clubId, clubs.id))
      .where(inArray(bookings.id, updated.map((u) => u.id)));
    await announceGuestlistDecision(rows, status, finalReason);
  }

  return NextResponse.json({ ok: true, updated: updated.length, skipped: ids.length - updated.length });
}

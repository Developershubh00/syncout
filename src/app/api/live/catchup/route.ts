import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getUser } from "@/lib/session";
import { eq, ne, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Every decided booking for this user. The client compares against what it
 * last showed and pops anything it missed, so a decision made overnight
 * still gets announced the next time the app is opened.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ decided: [] });

  const rows = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      rejectionReason: bookings.rejectionReason,
      eventTitle: events.title,
      clubName: clubs.name,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(and(eq(bookings.userId, user.id), ne(bookings.status, "pending")));

  return NextResponse.json({ decided: rows });
}

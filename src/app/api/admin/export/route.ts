import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { and, eq, gte, lt } from "drizzle-orm";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * Tonight's approved guests as CSV. "Tonight" runs to 6am so a 1am
 * arrival is still on the right list.
 */
export async function GET() {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });

  // The whole of tonight, not "from now" — the door pulls this list at 11pm
  // for a night that started at 9, and it still has to be on it.
  const from = new Date();
  from.setHours(12, 0, 0, 0); // midday today
  const to = new Date();
  to.setHours(30, 0, 0, 0); // 6am tomorrow

  const rows = await db
    .select({
      club: clubs.name,
      night: events.title,
      starts: events.startsAt,
      code: bookings.code,
      name: bookings.guestName,
      phone: bookings.guestPhone,
      entry: bookings.entryType,
      guests: bookings.totalGuests,
      female: bookings.femaleCount,
      male: bookings.maleCount,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(
      and(
        eq(bookings.status, "approved"),
        gte(events.startsAt, from),
        lt(events.startsAt, to)
      )
    )
    .orderBy(clubs.name, bookings.guestName);

  const head = [
    "Club", "Night", "Starts", "Code", "Guest", "Phone",
    "Entry", "Guests", "Girls", "Guys", "Status",
  ];
  const body = rows.map((r) =>
    [
      r.club, r.night,
      r.starts ? new Date(r.starts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
      r.code, r.name, r.phone, r.entry, r.guests, r.female, r.male, r.status,
    ].map(csvCell).join(",")
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response([head.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syncout-door-${stamp}.csv"`,
    },
  });
}

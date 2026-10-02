import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";
import { istNightWindow } from "@/lib/guestlist";

export const dynamic = "force-dynamic";

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/**
 * The door list as CSV. ?event=<night id> exports one night; otherwise it's
 * tonight in IST — midday to 6 AM, so a 1 AM pull still lists the right people.
 */
export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });

  const eventId = new URL(req.url).searchParams.get("event");
  const { from, to } = istNightWindow();

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
        inArray(bookings.status, ["approved", "checked_in"]),
        eventId ? eq(bookings.eventId, eventId) : and(gte(events.startsAt, from), lt(events.startsAt, to))
      )
    )
    .orderBy(asc(clubs.name), asc(bookings.guestName));

  const head = ["Club", "Night", "Starts", "Code", "Guest", "Phone", "Entry", "Guests", "Girls", "Guys", "Status"];
  const body = rows.map((r) =>
    [
      r.club, r.night,
      r.starts ? new Date(r.starts).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "",
      r.code, r.name, r.phone, r.entry, r.guests, r.female, r.male, r.status,
    ].map(csvCell).join(",")
  );

  const stamp = from.toISOString().slice(0, 10);
  // BOM so Excel opens names and ₹ correctly.
  return new Response("\uFEFF" + [head.join(","), ...body].join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="syncout-door-${eventId ? "night" : stamp}.csv"`,
    },
  });
}

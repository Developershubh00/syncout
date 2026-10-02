// Club NIGHTS (the guestlist "events" table). Ticketed events live under /api/admin/tevents.
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { eventSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await db.select().from(events).orderBy(desc(events.startsAt)).limit(300));
}

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = eventSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  const { startsAt, endsAt, ...rest } = parsed.data;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return fail("Pick a start time", 422);
  try {
    const [row] = await db
      .insert(events)
      .values({ ...rest, startsAt: start, endsAt: endsAt ? new Date(endsAt) : null })
      .returning();
    bust(TAGS.nights);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("A night with that slug already exists — change the title or date", 409);
    throw e;
  }
}

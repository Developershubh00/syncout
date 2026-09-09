import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { eventSchema } from "@/lib/validators";

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(events).orderBy(desc(events.startsAt)).limit(300));
}

export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = eventSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const { startsAt, endsAt, ...rest } = parsed.data;
  const [row] = await db
    .insert(events)
    .values({ ...rest, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

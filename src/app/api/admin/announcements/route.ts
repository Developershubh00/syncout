import { NextResponse } from "next/server";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { announcementSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail } from "@/lib/api";

const dt = (v?: string | null) => (v ? new Date(v) : null);

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await db.select().from(announcements).orderBy(desc(announcements.createdAt)));
}

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = announcementSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  const [row] = await db
    .insert(announcements)
    .values({ ...d, startsAt: dt(d.startsAt), endsAt: dt(d.endsAt) })
    .returning();
  bust(TAGS.announcements);
  return NextResponse.json(row, { status: 201 });
}

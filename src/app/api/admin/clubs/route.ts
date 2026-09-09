import { NextResponse } from "next/server";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { clubSchema } from "@/lib/validators";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET() {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await db.select().from(clubs).orderBy(desc(clubs.createdAt)));
}

export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = clubSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const [row] = await db.insert(clubs).values(parsed.data).returning();
  // Without this a new club sits behind the cache for up to ten minutes.
  revalidateTag(TAGS.clubs, "max");
  return NextResponse.json(row, { status: 201 });
}

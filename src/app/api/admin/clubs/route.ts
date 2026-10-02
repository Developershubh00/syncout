import { NextResponse } from "next/server";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { clubSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await db.select().from(clubs).orderBy(desc(clubs.createdAt)));
}

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = clubSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  try {
    const [row] = await db.insert(clubs).values(parsed.data).returning();
    bust(TAGS.clubs);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used by another club", 409);
    throw e;
  }
}

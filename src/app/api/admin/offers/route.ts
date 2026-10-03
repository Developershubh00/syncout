import { NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { asc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { offerSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, guard } from "@/lib/api";

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await db.select().from(offers).orderBy(asc(offers.sortOrder)));
}

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = offerSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { validTill, ...rest } = parsed.data;
  const [row] = await db
    .insert(offers)
    .values({ ...rest, clubId: rest.clubId || null, validTill: validTill ? new Date(validTill) : null })
    .returning();
  bust(TAGS.offers);
  return NextResponse.json(row, { status: 201 });
}

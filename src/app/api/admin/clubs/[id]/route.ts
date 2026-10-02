import { NextResponse } from "next/server";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { clubSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = clubSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  try {
    const [row] = await db.update(clubs).set(parsed.data).where(eq(clubs.id, (await params).id)).returning();
    if (!row) return fail("Club not found", 404);
    bust(TAGS.clubs, TAGS.nights);
    return NextResponse.json(row);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used by another club", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(clubs).where(eq(clubs.id, (await params).id));
  bust(TAGS.clubs, TAGS.nights);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { jobOpenings } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { openingSchema } from "@/lib/validators";
import { readJson, fail, isUniqueViolation, guard } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = openingSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  try {
    await db.update(jobOpenings).set(parsed.data).where(eq(jobOpenings.id, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(jobOpenings).where(eq(jobOpenings.id, (await params).id));
  return NextResponse.json({ ok: true });
}

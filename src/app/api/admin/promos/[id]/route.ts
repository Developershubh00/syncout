import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { promoBaseSchema } from "@/lib/validators";
import { readJson, fail, isUniqueViolation, guard } from "@/lib/api";
import { normCode } from "@/lib/promos";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = promoBaseSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { startsAt, endsAt, code, ...d } = parsed.data;
  if (d.kind === "percent" && d.value != null && d.value > 100) return fail("A percent code can't be more than 100%", 422);
  try {
    await db
      .update(promoCodes)
      .set({
        ...d,
        ...(code ? { code: normCode(code) } : {}),
        ...(startsAt !== undefined ? { startsAt: startsAt ? new Date(startsAt) : null } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
      })
      .where(eq(promoCodes.id, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That code already exists", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(promoCodes).where(eq(promoCodes.id, (await params).id));
  return NextResponse.json({ ok: true });
}

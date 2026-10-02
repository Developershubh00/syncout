import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { staffSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = staffSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { pin, ...rest } = parsed.data;
  try {
    await db
      .update(staff)
      .set({ ...rest, ...(pin ? { pinHash: await hashPassword(pin) } : {}) })
      .where(eq(staff.id, (await params).id));
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That number already has a door login", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(staff).where(eq(staff.id, (await params).id));
  return NextResponse.json({ ok: true });
}

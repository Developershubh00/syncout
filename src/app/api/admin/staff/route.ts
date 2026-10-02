import { NextResponse } from "next/server";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { staffSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = staffSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  if (!parsed.data.pin) return fail("Set a 4–8 digit PIN", 422);
  try {
    const [row] = await db
      .insert(staff)
      .values({ name: parsed.data.name, phone: parsed.data.phone, pinHash: await hashPassword(parsed.data.pin), isActive: parsed.data.isActive ?? true })
      .returning({ id: staff.id });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That number already has a door login", 409);
    throw e;
  }
}

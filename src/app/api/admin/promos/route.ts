import { NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { promoSchema } from "@/lib/validators";
import { readJson, fail, isUniqueViolation } from "@/lib/api";
import { normCode } from "@/lib/promos";

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = promoSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;
  try {
    const [row] = await db
      .insert(promoCodes)
      .values({
        ...d,
        code: normCode(d.code),
        startsAt: d.startsAt ? new Date(d.startsAt) : null,
        endsAt: d.endsAt ? new Date(d.endsAt) : null,
      })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That code already exists", 409);
    throw e;
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobOpenings } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { openingSchema } from "@/lib/validators";
import { readJson, fail, isUniqueViolation } from "@/lib/api";

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = openingSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  try {
    const [row] = await db.insert(jobOpenings).values(parsed.data).returning();
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used", 409);
    throw e;
  }
}

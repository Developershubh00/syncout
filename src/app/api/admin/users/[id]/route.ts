import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { deleteAccount } from "@/lib/account-delete";
import { readJson, fail } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ isBlocked: z.boolean().optional(), isVerified: z.boolean().optional() }).safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad request", 422);
  await db.update(users).set(parsed.data).where(eq(users.id, (await params).id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await deleteAccount((await params).id);
  return NextResponse.json({ ok: true });
}

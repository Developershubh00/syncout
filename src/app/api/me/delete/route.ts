import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser, clearUserSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";
import { deleteAccount } from "@/lib/account-delete";
import { readJson } from "@/lib/api";

export async function POST(req: Request) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const parsed = z.object({ password: z.string().min(1) }).safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter your password to confirm" }, { status: 422 });
  const [u] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id)).limit(1);
  if (!u || !(await verifyPassword(parsed.data.password, u.hash))) return NextResponse.json({ error: "Password is wrong" }, { status: 401 });
  await deleteAccount(me.id);
  await clearUserSession();
  return NextResponse.json({ ok: true });
}

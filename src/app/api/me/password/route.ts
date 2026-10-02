import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser } from "@/lib/session";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/validators";
import { readJson } from "@/lib/api";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const rl = rateLimit(`pw:${clientIp(req)}`, 10, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries — wait a bit." }, { status: 429 });
  const parsed = passwordChangeSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const [u] = await db.select({ hash: users.passwordHash, set: users.passwordSet }).from(users).where(eq(users.id, me.id)).limit(1);
  if (!u) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  if (u.set && !(parsed.data.current && (await verifyPassword(parsed.data.current, u.hash))))
    return NextResponse.json({ error: "Current password is wrong" }, { status: 401 });
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.next), passwordSet: true }).where(eq(users.id, me.id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/auth";
import { createUserSession, AuthNotConfigured } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson, guard } from "@/lib/api";

// Compared against when the email doesn't exist, so timing doesn't reveal accounts.
const DUMMY_HASH = "$2a$10$sw2LBJWzO9ZT0jG0DVqkleheuqQNy.tfP6pbdFf5IaIcggo56qwqO";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const rl = rateLimit(`login:${clientIp(req)}`, 15, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const parsed = loginSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password" }, { status: 422 });

  const email = parsed.data.email.toLowerCase().trim();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  const ok = await verifyPassword(parsed.data.password, u?.passwordHash ?? DUMMY_HASH);
  if (!u || !ok) return NextResponse.json({ error: "Email or password is wrong" }, { status: 401 });

  if (u.isBlocked) return NextResponse.json({ error: "This account is on hold. Contact support." }, { status: 403 });

  try {
    await createUserSession({ id: u.id, name: u.name, email: u.email });
  } catch (e) {
    if (e instanceof AuthNotConfigured)
      return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again later." }, { status: 503 });
    throw e;
  }
  return NextResponse.json({ ok: true });
}

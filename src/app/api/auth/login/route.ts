import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { loginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/auth";
import { createUserSession } from "@/lib/session";

export async function POST(req: Request) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter your email and password" }, { status: 422 });

  const email = parsed.data.email.toLowerCase().trim();
  const [u] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash)))
    return NextResponse.json({ error: "Email or password is wrong" }, { status: 401 });

  if (u.isBlocked) return NextResponse.json({ error: "This account is on hold. Contact support." }, { status: 403 });

  await createUserSession({ id: u.id, name: u.name, email: u.email });
  return NextResponse.json({ ok: true });
}

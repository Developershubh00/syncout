import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, ticketOrders, users } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { createUserSession, AuthNotConfigured } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson, isUniqueViolation } from "@/lib/api";

export async function POST(req: Request) {
  const rl = rateLimit(`register:${clientIp(req)}`, 10, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many sign-ups from here. Try again later." }, { status: 429 });

  const parsed = registerSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing)
    return NextResponse.json({ error: "That email already has an account. Log in instead." }, { status: 409 });

  let u: { id: string; name: string; email: string };
  try {
    [u] = await db
      .insert(users)
      .values({
        name: d.name.trim(),
        email,
        phone: d.phone,
        passwordHash: await hashPassword(d.password),
        gender: d.gender,
        citySlug: d.citySlug,
        instagram: d.instagram || null,
      })
      .returning({ id: users.id, name: users.name, email: users.email });
  } catch (e) {
    if (isUniqueViolation(e))
      return NextResponse.json({ error: "That email already has an account. Log in instead." }, { status: 409 });
    throw e;
  }

  // Anything they booked before signing up, with this email, becomes theirs —
  // so their passes and tickets show up and they get approval popups.
  await Promise.all([
    db.update(bookings).set({ userId: u.id }).where(and(isNull(bookings.userId), eq(bookings.guestEmail, email))),
    db.update(ticketOrders).set({ userId: u.id }).where(and(isNull(ticketOrders.userId), eq(ticketOrders.email, email))),
  ]).catch(() => {});

  try {
    await createUserSession(u);
  } catch (e) {
    if (e instanceof AuthNotConfigured)
      return NextResponse.json({ error: "Account created, but sign-in is unavailable right now." }, { status: 503 });
    throw e;
  }
  return NextResponse.json({ ok: true, user: u }, { status: 201 });
}

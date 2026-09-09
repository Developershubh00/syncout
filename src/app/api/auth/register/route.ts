import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";
import { createUserSession } from "@/lib/session";

export async function POST(req: Request) {
  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const d = parsed.data;
  const email = d.email.toLowerCase().trim();

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing)
    return NextResponse.json({ error: "That email already has an account. Log in instead." }, { status: 409 });

  const [u] = await db
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

  await createUserSession(u);
  return NextResponse.json({ ok: true, user: u }, { status: 201 });
}

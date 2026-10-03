import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getUser, createUserSession } from "@/lib/session";
import { profileSchema } from "@/lib/validators";
import { readJson, guard } from "@/lib/api";

export async function GET() {
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const [u] = await db
    .select({ name: users.name, email: users.email, phone: users.phone, instagram: users.instagram, citySlug: users.citySlug, gender: users.gender })
    .from(users)
    .where(eq(users.id, me.id))
    .limit(1);
  return NextResponse.json(u ?? null);
}

export async function PATCH(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const me = await getUser();
  if (!me) return NextResponse.json({ error: "Log in first" }, { status: 401 });
  const parsed = profileSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const d = parsed.data;
  const [u] = await db
    .update(users)
    .set({ name: d.name, phone: d.phone, instagram: d.instagram || null, citySlug: d.citySlug, gender: d.gender ?? null })
    .where(eq(users.id, me.id))
    .returning({ id: users.id, name: users.name, email: users.email });
  if (u) await createUserSession(u); // keep the name in the session current
  return NextResponse.json({ ok: true });
}

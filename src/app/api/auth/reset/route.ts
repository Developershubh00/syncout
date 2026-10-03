import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { resetSchema } from "@/lib/validators";
import { consumeReset } from "@/lib/password-reset";
import { hashPassword } from "@/lib/auth";
import { readJson, guard } from "@/lib/api";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const parsed = resetSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const userId = await consumeReset(parsed.data.token);
  if (!userId) return NextResponse.json({ error: "This link has expired or was already used. Ask for a new one." }, { status: 410 });
  await db.update(users).set({ passwordHash: await hashPassword(parsed.data.password), passwordSet: true }).where(eq(users.id, userId));
  return NextResponse.json({ ok: true });
}

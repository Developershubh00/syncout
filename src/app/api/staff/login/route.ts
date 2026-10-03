import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { staffLoginSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/auth";
import { createStaffSession } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson, guard } from "@/lib/api";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const rl = rateLimit(`staff:${clientIp(req)}`, 10, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries — wait 15 minutes." }, { status: 429 });
  const parsed = staffLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const [s] = await db.select().from(staff).where(eq(staff.phone, parsed.data.phone)).limit(1);
  const ok = s && s.isActive && (await verifyPassword(parsed.data.pin, s.pinHash));
  if (!ok) return NextResponse.json({ error: "Wrong number or PIN" }, { status: 401 });
  await createStaffSession({ staffId: s.id, name: s.name });
  await db.update(staff).set({ lastLoginAt: new Date() }).where(eq(staff.id, s.id));
  return NextResponse.json({ ok: true, name: s.name });
}

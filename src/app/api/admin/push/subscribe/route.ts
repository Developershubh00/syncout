import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminDevices } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { readJson, fail } from "@/lib/api";

const schema = z.object({ endpoint: z.string().url().max(1000), keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }), label: z.string().max(120).optional() });

export async function POST(req: Request) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad subscription", 422);
  const d = parsed.data;
  await db
    .insert(adminDevices)
    .values({ endpoint: d.endpoint, p256dh: d.keys.p256dh, auth: d.keys.auth, label: d.label ?? null })
    .onConflictDoUpdate({ target: adminDevices.endpoint, set: { p256dh: d.keys.p256dh, auth: d.keys.auth, label: d.label ?? null } });
  return NextResponse.json({ ok: true });
}

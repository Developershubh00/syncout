import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/session";
import { blockIp } from "@/lib/security/blocklist";
import { readJson, fail, guard } from "@/lib/api";

const ipRe = /^(?:\d{1,3}\.){3}\d{1,3}$|^[0-9a-fA-F:]+$/;
export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ ip: z.string().trim().regex(ipRe, "Enter a valid IP"), reason: z.string().max(200).optional(), minutes: z.number().int().positive().max(525600).optional() }).safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  await blockIp(parsed.data.ip, parsed.data.reason || "blocked by admin", "admin", parsed.data.minutes);
  return NextResponse.json({ ok: true });
}

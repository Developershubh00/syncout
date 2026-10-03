import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminDevices } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { readJson, fail, guard } from "@/lib/api";

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ endpoint: z.string().max(1000) }).safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad request", 422);
  await db.delete(adminDevices).where(eq(adminDevices.endpoint, parsed.data.endpoint));
  return NextResponse.json({ ok: true });
}

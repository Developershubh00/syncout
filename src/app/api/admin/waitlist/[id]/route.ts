import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { readJson, fail } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ status: z.enum(["waiting", "notified", "booked", "removed"]) }).safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad request", 422);
  await db.update(waitlist).set({ status: parsed.data.status }).where(eq(waitlist.id, (await params).id));
  return NextResponse.json({ ok: true });
}

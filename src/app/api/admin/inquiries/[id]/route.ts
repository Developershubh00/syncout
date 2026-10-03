import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { readJson, fail, guard } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ status: z.enum(["new", "handled"]).optional(), adminNote: z.string().max(500).optional().nullable() }).safeParse(await readJson(req));
  if (!parsed.success) return fail("Bad request", 422);
  await db.update(inquiries).set(parsed.data).where(eq(inquiries.id, (await params).id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(inquiries).where(eq(inquiries.id, (await params).id));
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { offers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { offerSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = offerSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const { validTill, clubId, ...rest } = parsed.data;
  const [row] = await db
    .update(offers)
    .set({
      ...rest,
      ...(clubId !== undefined ? { clubId: clubId || null } : {}),
      ...(validTill !== undefined ? { validTill: validTill ? new Date(validTill) : null } : {}),
    })
    .where(eq(offers.id, (await params).id))
    .returning();
  if (!row) return fail("Not found", 404);
  bust(TAGS.offers);
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(offers).where(eq(offers.id, (await params).id));
  bust(TAGS.offers);
  return NextResponse.json({ ok: true });
}

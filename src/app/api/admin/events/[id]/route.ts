// Club NIGHTS. Ticketed events live under /api/admin/tevents.
import { NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { eventSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation, guard } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = eventSchema.partial().safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  const { startsAt, endsAt, ...rest } = parsed.data;
  try {
    const [row] = await db
      .update(events)
      .set({
        ...rest,
        ...(startsAt ? { startsAt: new Date(startsAt) } : {}),
        ...(endsAt !== undefined ? { endsAt: endsAt ? new Date(endsAt) : null } : {}),
      })
      .where(eq(events.id, (await params).id))
      .returning();
    if (!row) return fail("Night not found", 404);
    bust(TAGS.nights);
    return NextResponse.json(row);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("A night with that slug already exists", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  await db.delete(events).where(eq(events.id, (await params).id));
  bust(TAGS.nights);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { ticketedEvents, ticketTiers, ticketOrders } from "@/db/schema";
import { and, count, eq, inArray, notInArray } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { ticketedEventSchema } from "@/lib/validators";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation, guard } from "@/lib/api";
import { eventValues } from "../shared";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const { id } = await params;
  const parsed = ticketedEventSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  const values = eventValues(parsed.data);
  if (!values.ok) return fail(values.error, 422);

  try {
    const [ev] = await db.update(ticketedEvents).set(values.event).where(eq(ticketedEvents.id, id)).returning();
    if (!ev) return fail("Event not found", 404);

    // Sync ticket types: update kept ones, add new ones, drop removed ones.
    // Orders keep their own snapshot of the ticket name and price.
    const tiers = parsed.data.tiers;
    const keep = tiers.filter((t) => t.id).map((t) => t.id!) as string[];
    await db
      .delete(ticketTiers)
      .where(keep.length ? and(eq(ticketTiers.eventId, id), notInArray(ticketTiers.id, keep)) : eq(ticketTiers.eventId, id));
    for (const [i, t] of tiers.entries()) {
      const v = {
        name: t.name,
        description: t.description || null,
        price: t.price,
        admits: t.admits,
        capacity: t.capacity ?? null,
        perOrderMax: t.perOrderMax,
        isActive: t.isActive,
        sortOrder: i,
        compareAtPrice: t.compareAtPrice ?? null,
        salesStartAt: t.salesStartAt ? new Date(t.salesStartAt) : null,
        salesEndAt: t.salesEndAt ? new Date(t.salesEndAt) : null,
        badge: t.badge || null,
      };
      if (t.id) await db.update(ticketTiers).set(v).where(and(eq(ticketTiers.id, t.id), eq(ticketTiers.eventId, id)));
      else await db.insert(ticketTiers).values({ ...v, eventId: id });
    }

    bust(TAGS.events);
    return NextResponse.json(ev);
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used by another event", 409);
    throw e;
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const { id } = await params;
  const [{ n }] = await db
    .select({ n: count() })
    .from(ticketOrders)
    .where(and(eq(ticketOrders.eventId, id), inArray(ticketOrders.status, ["awaiting_payment", "payment_submitted", "confirmed", "checked_in"])));
  if (n > 0) return fail(`This event has ${n} live booking${n > 1 ? "s" : ""}. Turn off "Live" to hide it instead.`, 409);
  await db.delete(ticketedEvents).where(eq(ticketedEvents.id, id));
  bust(TAGS.events);
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { ticketedEvents, ticketTiers } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { ticketedEventSchema } from "@/lib/validators";
import { adminEvents } from "@/lib/tevents";
import { bust, TAGS } from "@/lib/tags";
import { readJson, fail, isUniqueViolation, guard } from "@/lib/api";
import { eventValues } from "./shared";

export async function GET() {
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  return NextResponse.json(await adminEvents());
}

export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = ticketedEventSchema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);

  const values = eventValues(parsed.data);
  if (!values.ok) return fail(values.error, 422);

  try {
    const [ev] = await db.insert(ticketedEvents).values(values.event).returning();
    if (parsed.data.tiers.length) {
      await db.insert(ticketTiers).values(
        parsed.data.tiers.map((t, i) => ({
          eventId: ev.id,
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
        }))
      );
    }
    bust(TAGS.events);
    return NextResponse.json(ev, { status: 201 });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("That slug is already used by another event", 409);
    throw e;
  }
}

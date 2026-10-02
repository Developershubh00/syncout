import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketTiers, ticketedEvents, waitlist } from "@/db/schema";
import { waitlistSchema } from "@/lib/validators";
import { getUser } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";

export async function POST(req: Request) {
  const rl = rateLimit(`wait:${clientIp(req)}`, 8, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests — try again later." }, { status: 429 });
  const parsed = waitlistSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const d = parsed.data;
  const [ev] = await db.select({ id: ticketedEvents.id }).from(ticketedEvents).where(eq(ticketedEvents.id, d.eventId)).limit(1);
  if (!ev) return NextResponse.json({ error: "That event isn't listed" }, { status: 404 });
  const tier = d.tierId
    ? (await db.select({ name: ticketTiers.name }).from(ticketTiers).where(and(eq(ticketTiers.id, d.tierId), eq(ticketTiers.eventId, d.eventId))).limit(1))[0]
    : undefined;

  // Same person, same ticket, same day → keep one entry.
  const [dup] = await db
    .select({ id: waitlist.id })
    .from(waitlist)
    .where(and(eq(waitlist.eventId, d.eventId), eq(waitlist.phone, d.phone), eq(waitlist.status, "waiting")))
    .limit(1);
  if (dup) return NextResponse.json({ ok: true, already: true });

  const user = await getUser();
  await db.insert(waitlist).values({
    eventId: d.eventId, tierId: d.tierId ?? null, tierName: tier?.name ?? null, day: d.day ?? null, userId: user?.id ?? null,
    name: d.name, phone: d.phone, email: d.email || user?.email || null, quantity: d.quantity,
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}

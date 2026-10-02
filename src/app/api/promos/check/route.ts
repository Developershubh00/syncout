import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketTiers } from "@/db/schema";
import { quotePromo } from "@/lib/promos";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";

const schema = z.object({ code: z.string().max(30), eventId: z.string().uuid(), tierId: z.string().uuid(), quantity: z.number().int().min(1).max(50) });

export async function POST(req: Request) {
  const rl = rateLimit(`promo:${clientIp(req)}`, 30, 10 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many tries — wait a few minutes." }, { status: 429 });
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter a code" }, { status: 422 });
  const d = parsed.data;
  const [tier] = await db.select({ price: ticketTiers.price }).from(ticketTiers).where(and(eq(ticketTiers.id, d.tierId), eq(ticketTiers.eventId, d.eventId))).limit(1);
  if (!tier) return NextResponse.json({ error: "Pick a ticket first" }, { status: 422 });
  const subtotal = tier.price * d.quantity;
  const q = await quotePromo(d.code, { eventId: d.eventId, subtotal, quantity: d.quantity });
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: 422 });
  return NextResponse.json({ ok: true, code: q.code, label: q.label, discount: q.discount, subtotal, total: subtotal - q.discount });
}

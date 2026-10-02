import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";

export type PromoQuote = { ok: true; id: string; code: string; discount: number; label: string } | { ok: false; error: string };

export const normCode = (raw: string) => raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");

export function describePromo(p: { kind: string; value: number; maxDiscount: number | null }) {
  return p.kind === "percent" ? `${p.value}% off${p.maxDiscount ? ` (up to ₹${p.maxDiscount})` : ""}` : `₹${p.value} off`;
}

/** What a code is worth on this booking — server prices only, never the browser's. */
export async function quotePromo(raw: string, ctx: { eventId: string; subtotal: number; quantity: number }): Promise<PromoQuote> {
  const code = normCode(raw);
  if (!code) return { ok: false, error: "Enter a code" };
  const [p] = await db.select().from(promoCodes).where(eq(promoCodes.code, code)).limit(1);
  const now = Date.now();
  if (!p || !p.isActive) return { ok: false, error: "That code isn't valid" };
  if (p.startsAt && p.startsAt.getTime() > now) return { ok: false, error: "That code isn't active yet" };
  if (p.endsAt && p.endsAt.getTime() < now) return { ok: false, error: "That code has expired" };
  if (p.eventId && p.eventId !== ctx.eventId) return { ok: false, error: "That code is for a different event" };
  if (ctx.quantity < p.minQuantity) return { ok: false, error: `Book at least ${p.minQuantity} tickets to use this code` };
  if (p.maxUses != null && p.usedCount >= p.maxUses) return { ok: false, error: "That code has been fully used" };
  let discount = p.kind === "percent" ? Math.floor((ctx.subtotal * p.value) / 100) : p.value;
  if (p.maxDiscount) discount = Math.min(discount, p.maxDiscount);
  discount = Math.max(0, Math.min(discount, ctx.subtotal));
  if (!discount) return { ok: false, error: "Nothing to discount on this booking" };
  return { ok: true, id: p.id, code: p.code, discount, label: `${p.code} · ${describePromo(p)}` };
}

/** Takes one use atomically — false if someone else just took the last one. */
export async function claimPromo(id: string) {
  const r = await db
    .update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(and(eq(promoCodes.id, id), sql`(${promoCodes.maxUses} is null or ${promoCodes.usedCount} < ${promoCodes.maxUses})`))
    .returning({ id: promoCodes.id });
  return r.length > 0;
}

export async function releasePromo(id: string) {
  await db.update(promoCodes).set({ usedCount: sql`greatest(${promoCodes.usedCount} - 1, 0)` }).where(eq(promoCodes.id, id));
}

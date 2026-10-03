import "server-only";
import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ipBlocks, securityEvents } from "@/db/schema";

/**
 * The durable block list, cached briefly in memory so the hot path does one
 * cheap check, not a query per request.
 */
let cache: { set: Set<string>; at: number } = { set: new Set(), at: 0 };
const TTL = 8_000; // block list refreshes every 8s, so admin blocks apply quickly

export async function blockedIps(): Promise<Set<string>> {
  if (Date.now() - cache.at < TTL) return cache.set;
  try {
    const rows = await db
      .select({ ip: ipBlocks.ip })
      .from(ipBlocks)
      .where(or(isNull(ipBlocks.expiresAt), gt(ipBlocks.expiresAt, new Date())));
    cache = { set: new Set(rows.map((r) => r.ip)), at: Date.now() };
  } catch {
    // On a DB blip, keep serving with whatever we had — never fail open loudly.
    cache.at = Date.now();
  }
  return cache.set;
}

export async function isBlocked(ip: string): Promise<boolean> {
  return (await blockedIps()).has(ip);
}

export async function blockIp(ip: string, reason: string, by = "auto", minutes?: number) {
  const expiresAt = minutes ? new Date(Date.now() + minutes * 60_000) : null;
  await db
    .insert(ipBlocks)
    .values({ ip, reason, by, hits: 1, expiresAt })
    .onConflictDoUpdate({ target: ipBlocks.ip, set: { reason, by, expiresAt, hits: sql`${ipBlocks.hits} + 1` } });
  cache.at = 0;
}

export async function unblockIp(ip: string) {
  await db.delete(ipBlocks).where(eq(ipBlocks.ip, ip));
  cache.at = 0;
}

/** Append to the security log. Best-effort — logging must never break a response. */
export async function logSecurity(e: { ip: string; kind: string; reason?: string; path?: string; method?: string; userAgent?: string | null; country?: string | null }) {
  try {
    await db.insert(securityEvents).values({
      ip: e.ip,
      kind: e.kind,
      reason: e.reason ?? null,
      path: e.path?.slice(0, 300) ?? null,
      method: e.method ?? null,
      userAgent: e.userAgent?.slice(0, 300) ?? null,
      country: e.country ?? null,
    });
    // After enough caught attacks from one IP, make the block durable.
    if (e.kind === "attack" || e.kind === "scan") {
      const [{ n }] = await db.execute(
        sql`select count(*)::int as n from security_events where ip = ${e.ip} and kind in ('attack','scan') and created_at > now() - interval '1 hour'`
      ).then((r) => (r as unknown as { rows: { n: number }[] }).rows ?? (r as unknown as { n: number }[]));
      if (Number(n) >= 5) await blockIp(e.ip, `auto: ${Number(n)} ${e.kind} hits/hour`, "auto", 24 * 60);
    }
  } catch {
    /* ignore */
  }
}

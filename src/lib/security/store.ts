/**
 * In-memory IP reputation for a single serverless instance: enough to slow a
 * burst and to trip the alert page on a scan. Durable, cross-instance blocks
 * live in the database (ip_blocks) and are checked separately.
 */
type Rec = { strikes: number; notFound: number; firstAt: number; lastAt: number; until: number; reasons: Set<string> };
const ips = new Map<string, Rec>();
const WINDOW = 10 * 60_000;
const MAX = 20_000;

function rec(ip: string): Rec {
  const now = Date.now();
  let r = ips.get(ip);
  if (!r || now - r.firstAt > WINDOW) {
    r = { strikes: 0, notFound: 0, firstAt: now, lastAt: now, until: r?.until ?? 0, reasons: new Set() };
    ips.set(ip, r);
  }
  return r;
}

export type Hit = { blocked: boolean; strikes: number; notFound: number; until: number; reasons: string[] };

/** Record an attack strike. Auto-blocks this instance for a while past a threshold. */
export function strike(ip: string, reason: string, weight = 1): Hit {
  if (ips.size > MAX) ips.clear();
  const r = rec(ip);
  r.strikes += weight;
  r.lastAt = Date.now();
  r.reasons.add(reason);
  if (r.strikes >= 3) r.until = Date.now() + 60 * 60_000; // an hour on this instance
  return snapshot(ip, r);
}

/** Record a probe / not-found hit. Many in a short window → treat like an attacker. */
export function noteNotFound(ip: string): Hit {
  const r = rec(ip);
  r.notFound += 1;
  r.lastAt = Date.now();
  if (r.notFound >= 8) {
    r.strikes = Math.max(r.strikes, 3);
    r.until = Date.now() + 30 * 60_000;
    r.reasons.add("scanning");
  }
  return snapshot(ip, r);
}

export function status(ip: string): Hit {
  const r = ips.get(ip);
  if (!r) return { blocked: false, strikes: 0, notFound: 0, until: 0, reasons: [] };
  return snapshot(ip, r);
}

function snapshot(ip: string, r: Rec): Hit {
  return { blocked: r.until > Date.now(), strikes: r.strikes, notFound: r.notFound, until: r.until, reasons: [...r.reasons] };
}

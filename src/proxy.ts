import { NextResponse, type NextRequest } from "next/server";
import { screen, badBot, isExempt } from "@/lib/security/rules";
import { isBlocked, logSecurity } from "@/lib/security/blocklist";

/**
 * Edge firewall — runs before any page or API code, on every request.
 *
 * It can't query Postgres from the edge, so it does the fast, stateless checks
 * here (pattern screening, bad-bot UA, a per-instance burst ceiling) and hands
 * the durable work (block list, logging, auto-blocking) to a Node endpoint it
 * pings without blocking the response. Verdicts:
 *   attack / bad bot → the red /blocked alert page (403; JSON 403 for APIs)
 *   sustained scan   → /blocked after enough probes
 *   single probe     → a normal 404 (don't reveal to scanners what exists)
 */

type Rec = { n: number; nf: number; at: number; until: number };
const ips = new Map<string, Rec>();
const WINDOW = 60_000;
const MAX_IPS = 50_000;

function recFor(ip: string): Rec {
  const now = Date.now();
  let r = ips.get(ip);
  if (!r || now - r.at > WINDOW) r = { n: 0, nf: 0, at: now, until: r?.until ?? 0 };
  ips.set(ip, r);
  return r;
}

function ipOf(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "0.0.0.0";
}

/** Log a security event straight to the DB (the proxy runs on Node). Never blocks the response. */
function logEvent(req: NextRequest, ip: string, kind: string, reason: string, path: string) {
  void logSecurity({
    ip,
    kind,
    reason,
    path,
    method: req.method,
    userAgent: req.headers.get("user-agent"),
    country: req.headers.get("x-vercel-ip-country"),
  }).catch(() => {});
}

const blockPage = (req: NextRequest, status: number) => NextResponse.rewrite(new URL("/blocked", req.url), { status });

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  // Screen the raw, untouched URL from the wire, not Next's normalised nextUrl —
  // normalisation can hide an encoded payload that the raw request carries.
  let rawQuery = "";
  try {
    const q = req.url.indexOf("?");
    rawQuery = q >= 0 ? req.url.slice(q) : "";
  } catch {
    rawQuery = req.nextUrl.search;
  }
  const search = rawQuery || req.nextUrl.search;
  if (isExempt(pathname)) return NextResponse.next();

  const isApi = pathname.startsWith("/api/");
  const ip = ipOf(req);
  const ua = req.headers.get("user-agent");
  const now = Date.now();
  if (ips.size > MAX_IPS) ips.clear();

  const r = recFor(ip);

  // Durable DB block (set by an admin or auto-blocking): enforced on pages too.
  try {
    if (await isBlocked(ip)) return isApi ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : blockPage(req, 403);
  } catch {
    /* DB blip — fall through to the in-memory firewall, never fail open loudly */
  }

  // Still locked out from a recent burst/attack on this instance.
  if (r.until > now) return isApi ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : blockPage(req, 403);

  r.n += 1;

  // Burst ceiling: 300 requests / minute / instance.
  if (r.n > 300) {
    r.until = now + 5 * 60_000;
    logEvent(req, ip, "blocked", "flood", pathname);
    return isApi ? NextResponse.json({ error: "Too many requests" }, { status: 429 }) : blockPage(req, 429);
  }

  const verdict = screen(pathname, search);

  if (verdict.level === "attack" || badBot(ua)) {
    r.until = now + 60 * 60_000;
    logEvent(req, ip, verdict.level === "attack" ? "attack" : "bot", verdict.level === "attack" ? verdict.reason! : "bad-bot", pathname + search);
    return isApi ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : blockPage(req, 403);
  }

  if (verdict.level === "notfound") {
    r.nf += 1;
    logEvent(req, ip, "scan", "probe", pathname);
    if (r.nf >= 8) {
      r.until = now + 30 * 60_000;
      return blockPage(req, 403);
    }
    return NextResponse.rewrite(new URL("/404", req.url), { status: 404 });
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Robots-Tag", isApi ? "noindex" : res.headers.get("X-Robots-Tag") ?? "");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

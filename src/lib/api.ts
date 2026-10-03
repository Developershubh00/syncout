import { NextResponse } from "next/server";
import { headers } from "next/headers";
import type { ZodError } from "zod";
import { getAdmin } from "./session";
import { sameOrigin } from "./security/csrf";
import { isBlocked } from "./security/blocklist";

/** Caller's IP from the proxy headers (same logic as the firewall). */
export async function requestIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "0.0.0.0";
}

/**
 * The one guard every mutating API route runs first. Returns a Response to
 * send (blocked / cross-site), or null to proceed. The edge firewall already
 * screened the request for injection; this adds the two checks that need Node:
 * the durable DB block list and a cross-site (CSRF) check.
 */
export async function guard(req: Request): Promise<NextResponse | null> {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  try {
    if (await isBlocked(await requestIp())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch {
    /* DB blip — don't lock out real users; the edge firewall still stands */
  }
  return null;
}

/** Reads the JSON body AND runs {@link guard} first. Mutating routes use this and bail if it returns null-with-status. */
export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

export const zodMessage = (e: ZodError) => e.issues[0]?.message ?? "Check the form and try again";

/** null when signed in as admin, otherwise the 401 to return. */
export async function adminGate() {
  return (await getAdmin()) ? null : fail("Unauthorized", 401);
}

/** Postgres unique-violation on a given constraint name. */
export function isUniqueViolation(e: unknown, constraint?: string) {
  const err = e as { code?: string; constraint?: string; message?: string; cause?: { code?: string; constraint?: string } };
  const code = err?.code ?? err?.cause?.code;
  if (code !== "23505") return false;
  if (!constraint) return true;
  const c = err?.constraint ?? err?.cause?.constraint ?? "";
  return c === constraint || (err?.message ?? "").includes(constraint);
}

/** Rows from db.execute, whichever driver shape comes back. */
export function rowsOf<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  return ((res as { rows?: T[] })?.rows ?? []) as T[];
}

export function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

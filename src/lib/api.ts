import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { getAdmin } from "./session";

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

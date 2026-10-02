/** A quick picture of what the database has — for db:check, Admin → Overview and dev hints. */
import { sql } from "drizzle-orm";
import { db } from "./index";
import { missingTables } from "./upgrade-core";

export type DbHealth = {
  reachable: boolean;
  missing: string[];
  upcomingEvents: number;
  upcomingNights: number;
  error?: string;
};

async function count(q: ReturnType<typeof sql>) {
  const res = (await db.execute(q)) as unknown as { rows?: { n: number | string }[] } | { n: number | string }[];
  const r = Array.isArray(res) ? res : (res.rows ?? []);
  return Number(r[0]?.n ?? 0);
}

export async function dbHealth(): Promise<DbHealth> {
  const empty = { missing: [], upcomingEvents: 0, upcomingNights: 0 };
  if (!process.env.DATABASE_URL) return { reachable: false, ...empty, error: "DATABASE_URL is not set" };
  try {
    const missing = await missingTables();
    const upcomingNights = missing.includes("events")
      ? 0
      : await count(sql`select count(*)::int as n from events where is_active and starts_at >= now() - interval '6 hours'`);
    const upcomingEvents = missing.includes("ticketed_events")
      ? 0
      : await count(sql`select count(*)::int as n from ticketed_events where is_active and coalesce(ends_at, starts_at) >= now()`);
    return { reachable: true, missing, upcomingEvents, upcomingNights };
  } catch (e) {
    return { reachable: false, ...empty, error: (e as Error).message };
  }
}

/** What to tell a human, in order. Empty when all is well. */
export function healthAdvice(h: DbHealth): string[] {
  if (!h.reachable) return [`Can't reach the database: ${h.error}. Check DATABASE_URL.`];
  const out: string[] = [];
  if (h.missing.length) out.push(`Missing tables (${h.missing.join(", ")}) — run: npm run db:upgrade`);
  if (!h.missing.includes("ticketed_events") && h.upcomingEvents === 0) out.push("No upcoming events — run: npm run db:seed (adds the 15 Navratri 2026 events)");
  if (h.upcomingNights === 0) out.push("No upcoming club nights — add them in Admin → Nights, or run: npm run db:seed for the next 2 weeks");
  return out;
}

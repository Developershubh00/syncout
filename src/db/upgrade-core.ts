/**
 * Schema upgrades, shared by `npm run db:upgrade` and Admin → Set up database.
 * Replays the drizzle migrations rewritten to be idempotent, so it is safe to
 * run any number of times and never touches existing rows.
 */
import { sql } from "drizzle-orm";
import { db } from "./index";
import { MIGRATIONS } from "./migrations.generated";

export const REQUIRED_TABLES = [
  "users", "cities", "clubs", "events", "bookings", "offers", "reviews", "favorites",
  "ticketed_events", "ticket_tiers", "ticket_orders", "announcements", "notifications", "push_subscriptions", "settings",
  "password_resets", "inquiries", "job_openings", "job_applications",
];

export function idempotent(stmt: string): string {
  const s = stmt.trim().replace(/;\s*$/, "");
  if (!s) return "";
  if (/^CREATE TABLE\s+(?!IF NOT EXISTS)/i.test(s)) return s.replace(/^CREATE TABLE\s+/i, "CREATE TABLE IF NOT EXISTS ");
  if (/^CREATE UNIQUE INDEX\s+(?!IF NOT EXISTS)/i.test(s)) return s.replace(/^CREATE UNIQUE INDEX\s+/i, "CREATE UNIQUE INDEX IF NOT EXISTS ");
  if (/^CREATE INDEX\s+(?!IF NOT EXISTS)/i.test(s)) return s.replace(/^CREATE INDEX\s+/i, "CREATE INDEX IF NOT EXISTS ");
  if (/^ALTER TABLE\s+\S+\s+ADD COLUMN\s+(?!IF NOT EXISTS)/i.test(s)) return s.replace(/ADD COLUMN\s+/i, "ADD COLUMN IF NOT EXISTS ");
  // Constraints and enum types have no IF NOT EXISTS form — swallow "already there".
  if (/^(ALTER TABLE\s+\S+\s+ADD CONSTRAINT|CREATE TYPE)/i.test(s)) {
    return `DO $$ BEGIN ${s}; EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$`;
  }
  return s;
}

async function rows<T>(q: ReturnType<typeof sql>): Promise<T[]> {
  const res = (await db.execute(q)) as unknown as { rows?: T[] } | T[];
  return Array.isArray(res) ? res : (res.rows ?? []);
}

export async function missingTables(): Promise<string[]> {
  const found = new Set(
    (await rows<{ table_name: string }>(sql`select table_name from information_schema.tables where table_schema = 'public'`)).map(
      (r) => r.table_name
    )
  );
  return REQUIRED_TABLES.filter((t) => !found.has(t));
}

export async function upgradeDatabase(log: (line: string) => void = () => {}) {
  await db.execute(sql`create table if not exists _syncout_migrations (tag text primary key, applied_at timestamptz not null default now())`);
  const done = new Set((await rows<{ tag: string }>(sql`select tag from _syncout_migrations`)).map((r) => r.tag));
  const [{ n }] = await rows<{ n: number | string }>(
    sql`select count(*)::int as n from information_schema.tables where table_schema = 'public' and table_name = 'bookings'`
  );
  const hasBaseline = Number(n) > 0;

  const applied: string[] = [];
  for (const m of [...MIGRATIONS].sort((a, b) => a.idx - b.idx)) {
    if (done.has(m.tag)) continue;
    if (m.idx === 0 && hasBaseline) {
      await db.execute(sql`insert into _syncout_migrations (tag) values (${m.tag}) on conflict do nothing`);
      log(`  · ${m.tag} — baseline already present`);
      continue;
    }
    const list = m.sql.split("--> statement-breakpoint").map(idempotent).filter(Boolean);
    log(`  → ${m.tag} (${list.length} statements)`);
    for (const stmt of list) {
      try {
        await db.execute(sql.raw(stmt));
      } catch (e) {
        throw new Error(`${m.tag}: ${(e as Error).message}\n  in: ${stmt.slice(0, 160)}`);
      }
    }
    await db.execute(sql`insert into _syncout_migrations (tag) values (${m.tag}) on conflict do nothing`);
    applied.push(m.tag);
  }
  return { applied };
}

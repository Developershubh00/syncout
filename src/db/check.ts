/**
 * Confirms the database is reachable and the schema is actually there.
 *
 * Worth having because `drizzle-kit push` can exit 0 even when it failed to
 * connect — it prints the error but still returns a success code. Without this
 * check a bad DATABASE_URL looks like a clean install right up until the seed
 * blows up with something unrelated-looking.
 *
 * Run: npm run db:check
 */
import "./load-env";
import { db } from "./index";
import { sql } from "drizzle-orm";

const EXPECTED = [
  "bookings",
  "cities",
  "clubs",
  "events",
  "favorites",
  "offers",
  "reviews",
  "users",
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }

  let rows: Array<{ table_name: string }>;
  try {
    const res = (await db.execute(
      sql`select table_name from information_schema.tables where table_schema = 'public'`
    )) as unknown as { rows?: Array<{ table_name: string }> } | Array<{ table_name: string }>;
    rows = Array.isArray(res) ? res : (res.rows ?? []);
  } catch (err) {
    console.error("✗ Could not reach the database.");
    console.error(`  ${(err as Error)?.message ?? err}`);
    console.error("  Check DATABASE_URL in .env.local, and that the Neon project isn't paused.");
    process.exit(1);
  }

  const found = new Set(rows.map((r) => r.table_name));
  const missing = EXPECTED.filter((t) => !found.has(t));

  if (missing.length) {
    console.error(`✗ Connected, but ${missing.length} table(s) are missing: ${missing.join(", ")}`);
    console.error("  Run: npm run db:push");
    process.exit(1);
  }

  console.log(`✓ database reachable, all ${EXPECTED.length} tables present`);
  process.exit(0);
}

main();

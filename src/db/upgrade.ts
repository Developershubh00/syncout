/**
 * Brings the database schema up to date. Safe to run any number of times.
 *
 *   npm run db:upgrade
 *
 * Use this instead of `drizzle-kit push`: on Postgres 18 (newer Neon
 * projects) the drizzle-kit version in this repo half-applies changes and then
 * fails while still exiting 0. The same upgrade is one click in
 * Admin → Overview → Set up database.
 */
import "./load-env";
import { upgradeDatabase } from "./upgrade-core";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ DATABASE_URL is not set. Add it to .env.local.");
    process.exit(1);
  }
  try {
    const { applied } = await upgradeDatabase((l) => console.log(l));
    console.log(applied.length ? `✓ database upgraded (${applied.join(", ")})` : "✓ database already up to date");
    console.log("  Next: npm run db:seed   (adds the Navratri events and the next 2 weeks of nights)");
    process.exit(0);
  } catch (e) {
    console.error(`✗ Upgrade failed — nothing after the failing statement ran. Fix the cause and re-run; it's safe.\n  ${(e as Error).message}`);
    process.exit(1);
  }
}

main();

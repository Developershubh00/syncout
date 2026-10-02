/**
 * Runs before `next build`. On Vercel (where DATABASE_URL is set) this brings
 * the database schema up to date automatically, so new features never ship
 * ahead of their tables. Additive and idempotent — existing data is untouched.
 * No DATABASE_URL (CI, a fresh clone) → skipped. SKIP_DB_UPGRADE=1 → skipped.
 */
import "./load-env";
import { upgradeDatabase } from "./upgrade-core";

async function main() {
  if (!process.env.DATABASE_URL || process.env.SKIP_DB_UPGRADE === "1") {
    console.log("[db] no DATABASE_URL at build time — schema upgrade skipped");
    process.exit(0);
  }
  try {
    const { applied } = await upgradeDatabase((l) => console.log("[db]" + l));
    console.log(applied.length ? `[db] schema upgraded: ${applied.join(", ")}` : "[db] schema already up to date");
    process.exit(0);
  } catch (e) {
    console.error(`[db] schema upgrade failed, so this build stops and the live site keeps running the previous version.\n     ${(e as Error).message}`);
    process.exit(1);
  }
}

main();

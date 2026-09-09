/**
 * Env loader for scripts run outside Next (the seeder, one-off tasks).
 *
 * Next loads .env.local itself, but `tsx src/db/seed.ts` does not, so the
 * seeder has to. This lives in its own module and is imported for its side
 * effect *first* — ES imports are hoisted, so doing `config()` inline in a
 * script would run after every other import had already been evaluated.
 *
 * .env.local wins; .env is the fallback. dotenv never overwrites a variable
 * that is already set, so real environment variables still take priority.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

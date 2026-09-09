import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Lazy client. Next collects page data at build time, and CI builds without a
 * database, so the connection is only opened on the first real query.
 */
let client: NeonHttpDatabase<typeof schema> | null = null;

function connect(): NeonHttpDatabase<typeof schema> {
  if (client) return client;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is missing. Add your Neon connection string to .env.local");
  }
  client = drizzle(neon(url), { schema });
  return client;
}

export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_t, prop) {
    const target = connect() as unknown as Record<string | symbol, unknown>;
    const value = target[prop];
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export { schema };

import "server-only";
import { unstable_cache } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { TAGS } from "./tags";
import { DEFAULT_SETTINGS, normalizeSettings, type SiteSettings } from "./settings.defaults";

export * from "./settings.defaults";

async function readSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.key, "site")).limit(1);
  return normalizeSettings(row?.value);
}

const readCached = unstable_cache(readSettings, ["site-settings"], { revalidate: 300, tags: [TAGS.settings] });

/** Never throws: a missing table or a database blip falls back to defaults. */
export async function getSettings(): Promise<SiteSettings> {
  try {
    return await readCached();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Uncached read for the admin form. */
export async function getSettingsFresh(): Promise<SiteSettings> {
  try {
    return await readSettings();
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: SiteSettings) {
  const value = normalizeSettings(next) as unknown as Record<string, unknown>;
  await db
    .insert(settings)
    .values({ key: "site", value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });
}

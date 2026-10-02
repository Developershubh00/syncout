import "server-only";
import { unstable_cache } from "next/cache";
import { raw, safe } from "./queries";
import { rawEvents, type EventListRow } from "./tevents";
import { activeAnnouncementsRaw, type ActiveAnnouncement } from "./announcements";
import { TAGS } from "./tags";

export { TAGS, bust } from "./tags";

/*
 * Cached reads for public pages.
 *
 * Two rules this layer keeps:
 *  1. Failures are never cached. The raw query throws inside the cache, and
 *     safe() catches *outside* it — so a database blip shows an empty state
 *     for that one request instead of being stored for ten minutes.
 *  2. Dates come back as Dates. unstable_cache stores JSON, which turns them
 *     into strings; revive() turns the known date fields back.
 */

const DATE_KEYS = new Set(["startsAt", "endsAt", "createdAt", "validTill", "readAt", "updatedAt"]);

function revive<T>(v: T): T {
  if (Array.isArray(v)) return v.map(revive) as T;
  if (v && typeof v === "object" && !(v instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      out[k] = DATE_KEYS.has(k) && typeof val === "string" ? new Date(val) : revive(val);
    }
    return out as T;
  }
  return v;
}

function cached<A extends unknown[], R>(
  name: string,
  fn: (...args: A) => Promise<R>,
  opts: { revalidate: number; tags: string[] },
  fallback: R
) {
  const run = async (...args: A): Promise<R> => {
    const key = [name, ...args.map((a) => JSON.stringify(a ?? null))];
    const value = await unstable_cache(() => fn(...args), key, opts)();
    return revive(value);
  };
  Object.defineProperty(run, "name", { value: name });
  return safe(run, fallback);
}

/** Club lists change rarely; admin edits bust the tag anyway. */
export const cachedClubs = cached(
  "clubs",
  (citySlug: string, limit: number = 60) => raw.getClubs(citySlug, limit),
  { revalidate: 600, tags: [TAGS.clubs] },
  []
);

export const cachedClub = cached("club", (slug: string) => raw.getClub(slug), { revalidate: 600, tags: [TAGS.clubs] }, null);

/** Nights move more often. Booking counts are read separately and never cached. */
export const cachedNights = cached(
  "nights",
  (opts: { citySlug?: string; clubId?: string; limit?: number } = {}) => raw.getNights(opts),
  { revalidate: 60, tags: [TAGS.nights] },
  []
);

export const cachedNight = cached(
  "night",
  (slug: string) => raw.getNight(slug),
  { revalidate: 60, tags: [TAGS.nights, TAGS.clubs] },
  null
);

export const cachedOffers = cached("offers", () => raw.getOffers(), { revalidate: 120, tags: [TAGS.offers] }, []);

export const cachedEvents = cached(
  "events",
  (opts: { citySlug?: string; category?: string; limit?: number; featured?: boolean } = {}) => rawEvents.listEvents(opts),
  { revalidate: 120, tags: [TAGS.events] },
  [] as EventListRow[]
);

export const cachedEvent = cached(
  "event",
  (slug: string) => rawEvents.getEvent(slug),
  { revalidate: 120, tags: [TAGS.events] },
  null
);

export const cachedAnnouncements = cached(
  "announcements",
  () => activeAnnouncementsRaw(),
  { revalidate: 120, tags: [TAGS.announcements] },
  [] as ActiveAnnouncement[]
);

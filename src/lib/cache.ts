import "server-only";
import { unstable_cache } from "next/cache";
import { getClubs, getNights, getOffers } from "./queries";

/** Tags let admin writes drop the cache immediately instead of waiting it out. */
export const TAGS = {
  clubs: "clubs",
  nights: "nights",
  offers: "offers",
} as const;

/**
 * Club lists change rarely — a long window is fine, and any admin edit
 * busts it by tag anyway.
 */
export const cachedClubs = (citySlug: string, limit = 60) =>
  unstable_cache(
    () => getClubs(citySlug, limit),
    ["clubs", citySlug, String(limit)],
    { revalidate: 600, tags: [TAGS.clubs] }
  )();

/**
 * Nights move more often (an admin can close a list mid-evening), so this
 * window is short. Booking counts are read separately and never cached.
 */
export const cachedNights = (opts: { citySlug?: string; clubId?: string; limit?: number } = {}) =>
  unstable_cache(
    () => getNights(opts),
    ["nights", opts.citySlug ?? "-", opts.clubId ?? "-", String(opts.limit ?? 0)],
    { revalidate: 60, tags: [TAGS.nights] }
  )();

export const cachedOffers = () =>
  unstable_cache(() => getOffers(), ["offers"], {
    revalidate: 120,
    tags: [TAGS.offers],
  })();

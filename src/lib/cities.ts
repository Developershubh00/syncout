/**
 * The one list of cities. Everything that shows a city picker, a city label
 * or builds a city landing page reads from here.
 */
export type City = { slug: string; name: string; short: string; state: string; live: boolean };

export const CITIES: City[] = [
  { slug: "new-delhi", name: "New Delhi", short: "Delhi", state: "Delhi", live: true },
  { slug: "gurugram", name: "Gurugram", short: "Gurugram", state: "Haryana", live: true },
  { slug: "noida", name: "Noida", short: "Noida", state: "Uttar Pradesh", live: true },
  { slug: "greater-noida", name: "Greater Noida", short: "Gr. Noida", state: "Uttar Pradesh", live: false },
  { slug: "mumbai", name: "Mumbai", short: "Mumbai", state: "Maharashtra", live: false },
  { slug: "jaipur", name: "Jaipur", short: "Jaipur", state: "Rajasthan", live: false },
  { slug: "lucknow", name: "Lucknow", short: "Lucknow", state: "Uttar Pradesh", live: false },
  { slug: "kasol", name: "Kasol", short: "Kasol", state: "Himachal Pradesh", live: false },
  { slug: "dubai", name: "Dubai", short: "Dubai", state: "Dubai", live: false },
];

export const DEFAULT_CITY = "new-delhi";
export const LIVE_CITIES = CITIES.filter((c) => c.live);

export function cityBySlug(slug?: string | null) {
  return CITIES.find((c) => c.slug === slug) ?? null;
}

export function cityName(slug?: string | null, short = false) {
  const c = cityBySlug(slug);
  if (!c) return slug ?? "";
  return short ? c.short : c.name;
}

export function isLiveCity(slug?: string | null) {
  return Boolean(cityBySlug(slug)?.live);
}

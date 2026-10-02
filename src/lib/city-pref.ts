import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_CITY, isLiveCity } from "./cities";

export const CITY_COOKIE = "so_city";

/** ?city= wins; otherwise the city this visitor picked last time; otherwise Delhi. */
export async function preferredCity(param?: string | null) {
  if (param && isLiveCity(param)) return { city: param, explicit: true };
  const saved = (await cookies()).get(CITY_COOKIE)?.value;
  if (saved && isLiveCity(saved)) return { city: saved, explicit: false };
  return { city: DEFAULT_CITY, explicit: false };
}

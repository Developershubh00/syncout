"use client";
import { useEffect } from "react";

/** Saves the city someone just picked so their next visit opens on it. */
export function CityRemember({ city }: { city?: string | null }) {
  useEffect(() => {
    if (!city) return;
    document.cookie = `so_city=${encodeURIComponent(city)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  }, [city]);
  return null;
}

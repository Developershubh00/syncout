"use client";
import { useEffect } from "react";

export const PROMO_KEY = "so_promo";

/** Any page opened with ?promo=CODE remembers the code for 7 days, so influencer links work wherever they land. */
export function PromoCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(window.location.search).get("promo");
      if (code && /^[A-Za-z0-9_-]{3,30}$/.test(code)) {
        localStorage.setItem(PROMO_KEY, JSON.stringify({ code: code.toUpperCase(), until: Date.now() + 7 * 864e5 }));
      }
    } catch {}
  }, []);
  return null;
}

export function readSavedPromo(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(PROMO_KEY) || "null");
    return v && v.until > Date.now() ? v.code : null;
  } catch {
    return null;
  }
}

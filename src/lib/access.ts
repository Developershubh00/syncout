import "server-only";
import crypto from "node:crypto";

/**
 * Unguessable links for passes and tickets.
 *
 * The 6–7 character code is what the door types, so it can't double as the
 * secret that protects a guest's name and email. Links we hand out carry
 * ?k=<hmac>; without it (and without being the signed-in owner or an admin)
 * the page shows the night, not the person.
 */
function key() {
  return process.env.AUTH_SECRET || (process.env.NODE_ENV !== "production" ? "dev-only-insecure-secret-change-me" : "");
}

export function accessToken(kind: "pass" | "ticket" | "guest", code: string): string | null {
  const k = key();
  if (!k) return null;
  return crypto.createHmac("sha256", k).update(`${kind}:${code.toUpperCase()}`).digest("base64url").slice(0, 22);
}

export function hasAccess(kind: "pass" | "ticket" | "guest", code: string, token?: string | null) {
  const expected = accessToken(kind, code);
  if (!expected || !token || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

export function passPath(code: string) {
  const k = accessToken("pass", code);
  return `/passes/${code}${k ? `?k=${k}` : ""}`;
}

export function ticketPath(code: string) {
  const k = accessToken("ticket", code);
  return `/tickets/${code}${k ? `?k=${k}` : ""}`;
}

/** One friend's own pass inside a group ticket: /tickets/T…/guest/3?k=… */
export function guestPath(code: string, n: number) {
  const k = accessToken("guest", `${code}:${n}`);
  return `/tickets/${code}/guest/${n}${k ? `?k=${k}` : ""}`;
}

import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export const hashPassword = (p: string) => bcrypt.hash(p, 10);
export const verifyPassword = (p: string, hash: string) => bcrypt.compare(p, hash);

/** Constant-time string compare (hashing first so lengths can't leak). */
function same(a: string, b: string) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export type AdminCheck =
  | { ok: true; via: "password" | "key" }
  | { ok: false; reason: "invalid" | "not_configured" };

/**
 * Admin credentials live in env so they can be rotated without a deploy.
 * There are no built-in passwords in production: if the env vars are missing,
 * admin sign-in is off and says so. Local dev falls back to admin / admin.
 */
export function checkAdminCredentials(input: { username?: string; password?: string; authKey?: string }): AdminCheck {
  const dev = process.env.NODE_ENV !== "production";
  const U = process.env.ADMIN_USERNAME || (dev ? "admin" : "");
  const P = process.env.ADMIN_PASSWORD || (dev ? "admin" : "");
  const K = process.env.ADMIN_AUTH_KEY || (dev ? "admin-key" : "");

  if (!K && !(U && P)) return { ok: false, reason: "not_configured" };

  if (K && input.authKey && same(input.authKey, K)) return { ok: true, via: "key" };
  if (U && P && input.username && input.password && same(input.username, U) && same(input.password, P))
    return { ok: true, via: "password" };

  return { ok: false, reason: "invalid" };
}

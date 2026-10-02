import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Sessions are signed with AUTH_SECRET. In production there is no fallback:
 * a missing secret means nobody is signed in and sign-in returns a clear
 * error, rather than every visitor being able to forge an admin cookie with a
 * secret that's printed in a public repo. Pages keep rendering either way.
 */
export class AuthNotConfigured extends Error {
  constructor() {
    super("AUTH_SECRET is not set");
  }
}

const DEV_SECRET = "dev-only-insecure-secret-change-me";
let warned = false;

function secretKey(): Uint8Array | null {
  const s = process.env.AUTH_SECRET;
  if (s) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV !== "production") return new TextEncoder().encode(DEV_SECRET);
  if (!warned) {
    warned = true;
    console.error("[syncout] AUTH_SECRET is not set — sign-in is disabled until you add it to the environment.");
  }
  return null;
}

export function authConfigured() {
  return secretKey() !== null;
}

export const USER_COOKIE = "so_session";
export const ADMIN_COOKIE = "so_admin";

export type SessionUser = { id: string; name: string; email: string };
export type AdminSession = { admin: true; via: "password" | "key" };

async function sign(payload: Record<string, unknown>, ttl: string) {
  const key = secretKey();
  if (!key) throw new AuthNotConfigured();
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl).sign(key);
}

async function verify<T>(token?: string): Promise<T | null> {
  const key = secretKey();
  if (!token || !key) return null;
  try {
    const { payload } = await jwtVerify(token, key);
    return payload as T;
  } catch {
    return null;
  }
}

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
};

/* ── user ── */
export async function createUserSession(u: SessionUser) {
  const token = await sign({ ...u }, "30d");
  (await cookies()).set(USER_COOKIE, token, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export async function getUser(): Promise<SessionUser | null> {
  const c = (await cookies()).get(USER_COOKIE)?.value;
  const p = await verify<SessionUser & { exp: number }>(c);
  return p ? { id: p.id, name: p.name, email: p.email } : null;
}

export async function clearUserSession() {
  (await cookies()).delete(USER_COOKIE);
}

/* ── admin ── */
export async function createAdminSession(via: "password" | "key") {
  const token = await sign({ admin: true, via }, "12h");
  (await cookies()).set(ADMIN_COOKIE, token, { ...base, maxAge: 60 * 60 * 12 });
}

export async function getAdmin(): Promise<AdminSession | null> {
  const c = (await cookies()).get(ADMIN_COOKIE)?.value;
  const p = await verify<AdminSession>(c);
  return p?.admin ? { admin: true, via: p.via } : null;
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const a = await getAdmin();
  if (!a) throw new Error("UNAUTHORIZED");
  return a;
}

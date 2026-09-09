import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret-change-me"
);

export const USER_COOKIE = "so_session";
export const ADMIN_COOKIE = "so_admin";

export type SessionUser = { id: string; name: string; email: string };
export type AdminSession = { admin: true; via: "password" | "key" };

async function sign(payload: Record<string, unknown>, ttl: string) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret);
}

async function verify<T>(token?: string): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
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

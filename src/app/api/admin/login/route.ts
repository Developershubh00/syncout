import { NextResponse } from "next/server";
import { adminLoginSchema } from "@/lib/validators";
import { checkAdminCredentials } from "@/lib/auth";
import { createAdminSession, AuthNotConfigured } from "@/lib/session";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";

export async function POST(req: Request) {
  const rl = rateLimit(`admin-login:${clientIp(req)}`, 8, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfter / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const parsed = adminLoginSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const check = checkAdminCredentials(parsed.data);
  if (!check.ok) {
    if (check.reason === "not_configured") {
      return NextResponse.json(
        { error: "Admin sign-in isn't set up. Add ADMIN_PASSWORD or ADMIN_AUTH_KEY to the environment." },
        { status: 503 }
      );
    }
    // constant-ish delay to blunt guessing
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: "Those credentials don't match" }, { status: 401 });
  }

  try {
    await createAdminSession(check.via);
  } catch (e) {
    if (e instanceof AuthNotConfigured)
      return NextResponse.json({ error: "Sign-in is off until AUTH_SECRET is set in the environment." }, { status: 503 });
    throw e;
  }
  return NextResponse.json({ ok: true, via: check.via });
}

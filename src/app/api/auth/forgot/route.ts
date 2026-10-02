import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createResetLink } from "@/lib/password-reset";
import { sendMail, esc } from "@/lib/mail";
import { later } from "@/lib/notify";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";

/** Always answers the same way, so it can't be used to find out who has an account. */
export async function POST(req: Request) {
  const rl = rateLimit(`forgot:${clientIp(req)}`, 5, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many requests. Try again in an hour." }, { status: 429 });
  const parsed = z.object({ email: z.string().trim().email() }).safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: "Enter the email you signed up with" }, { status: 422 });

  const email = parsed.data.email.toLowerCase();
  const [u] = await db.select({ id: users.id, name: users.name, blocked: users.isBlocked }).from(users).where(eq(users.email, email)).limit(1);
  if (u && !u.blocked) {
    const link = await createResetLink(u.id);
    if (process.env.NODE_ENV !== "production") console.log(`[reset link] ${email}: ${link}`);
    later(() =>
      sendMail({
        to: email,
        subject: "Reset your SyncOut password",
        html: `<p>Hi ${esc(u.name)},</p><p>Tap below to set a new password. The link works once, for one hour.</p><p><a href="${esc(link)}" style="display:inline-block;background:#e4113c;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Set a new password</a></p><p>Didn't ask for this? Ignore this email — your password stays the same.</p>`,
      })
    );
  }
  return NextResponse.json({ ok: true });
}

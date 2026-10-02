import "server-only";
import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "./auth";
import { createUserSession, type SessionUser } from "./session";
import { createResetLink } from "./password-reset";
import { sendMail, esc } from "./mail";
import { later } from "./notify";

export type CheckoutAccount = { userId: string | null; account: "signed-in" | "created" | "existing" | null };

/** Someone not logged in whose email belongs to a blocked account can't book. */
export async function emailBlocked(email: string) {
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email.trim().toLowerCase()), eq(users.isBlocked, true)))
    .limit(1);
  return Boolean(u);
}

/**
 * Checkout without logging in:
 *  • new email → an account is created and signed in on this phone, so the
 *    ticket and its status are in Passes from now on;
 *  • email that already has an account → the booking is attached to it (it
 *    shows when they log in) but nobody is signed in — anyone can type an email.
 */
export async function accountForCheckout(user: SessionUser | null, p: { name: string; email: string; phone: string; citySlug?: string | null }): Promise<CheckoutAccount> {
  if (user) return { userId: user.id, account: "signed-in" };
  const email = p.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { userId: existing.id, account: "existing" };

  const [u] = await db
    .insert(users)
    .values({
      name: p.name.trim(),
      email,
      phone: p.phone,
      citySlug: p.citySlug ?? "new-delhi",
      passwordHash: await hashPassword(crypto.randomBytes(24).toString("base64url")),
      passwordSet: false,
    })
    .onConflictDoNothing()
    .returning({ id: users.id, name: users.name, email: users.email });
  if (!u) return { userId: null, account: null };
  try {
    await createUserSession(u);
  } catch {
    return { userId: u.id, account: "existing" }; // sessions not configured — still saved to the account
  }
  later(async () => {
    const link = await createResetLink(u.id, 7 * 864e5);
    await sendMail({
      to: email,
      subject: "Your tickets are saved in SyncOut",
      html: `<p>Hi ${esc(u.name)},</p>
<p>We saved your booking to a SyncOut account for <b>${esc(email)}</b>. Open SyncOut on this phone any time to see your tickets and their status — you're already logged in.</p>
<p>To log in on another phone, set a password (this link works for 7 days):</p>
<p><a href="${esc(link)}" style="display:inline-block;background:#e4113c;color:#fff;padding:12px 20px;border-radius:12px;text-decoration:none;font-weight:700">Set my password</a></p>`,
    });
  });
  return { userId: u.id, account: "created" };
}

import "server-only";
import crypto from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { passwordResets } from "@/db/schema";
import { absUrl } from "./site";

const sha = (t: string) => crypto.createHash("sha256").update(t).digest("hex");

/** A one-hour, single-use reset link. Only the hash is stored. */
export async function createResetLink(userId: string) {
  const token = crypto.randomBytes(32).toString("base64url");
  await db.insert(passwordResets).values({ userId, tokenHash: sha(token), expiresAt: new Date(Date.now() + 3600e3) });
  return absUrl(`/reset?token=${token}`);
}

export async function consumeReset(token: string) {
  const [row] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.tokenHash, sha(token)), isNull(passwordResets.usedAt), gt(passwordResets.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.userId, row.userId));
  return row.userId;
}

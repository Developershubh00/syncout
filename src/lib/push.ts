import "server-only";
import webpush from "web-push";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

/**
 * Web push. Dormant until VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY are set
 * (the v6 patch generates a pair into .env.local — copy both to Vercel).
 * iPhones only receive web push once SyncOut is installed to the home screen.
 */
let ready: boolean | null = null;

function setup() {
  if (ready !== null) return ready;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (ready = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:hello@syncout.in", pub, priv);
    ready = true;
  } catch (e) {
    console.error("[push] bad VAPID keys —", (e as Error).message);
    ready = false;
  }
  return ready;
}

export const pushEnabled = () => setup();
export const vapidPublicKey = () => (setup() ? process.env.VAPID_PUBLIC_KEY! : null);

export type PushPayload = { title: string; body?: string; url?: string; tag?: string };

export async function pushToUsers(userIds: string[], payload: PushPayload) {
  if (!setup() || !userIds.length) return 0;

  const subs: (typeof pushSubscriptions.$inferSelect)[] = [];
  for (let i = 0; i < userIds.length; i += 500) {
    subs.push(...(await db.select().from(pushSubscriptions).where(inArray(pushSubscriptions.userId, userIds.slice(i, i + 500)))));
  }

  const dead: string[] = [];
  let sent = 0;
  const body = JSON.stringify(payload);
  let i = 0;
  const worker = async () => {
    while (i < subs.length) {
      const s = subs[i++];
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          TTL: 60 * 60 * 24,
          timeout: 6000,
        });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.id);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(20, subs.length) }, worker));

  if (dead.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, dead)).catch(() => {});
  return sent;
}

/** Sends to raw subscriptions (admin devices). Returns endpoints that are gone for good. */
export async function pushToEndpoints(subs: { endpoint: string; p256dh: string; auth: string }[], payload: PushPayload) {
  if (!setup() || !subs.length) return { sent: 0, dead: [] as string[] };
  const body = JSON.stringify(payload);
  const dead: string[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 60 * 60 * 6, timeout: 6000, urgency: "high" });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) dead.push(s.endpoint);
      }
    })
  );
  return { sent, dead };
}

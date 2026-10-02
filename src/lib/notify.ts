import "server-only";
import { after } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { pushToUsers } from "./push";

export type NotifyInput = {
  kind: "approved" | "rejected" | "waitlisted" | "confirmed" | "broadcast" | "receipt" | "info";
  title: string;
  body?: string | null;
  url?: string | null;
  /** false = straight to the bell, no popup (e.g. "request received"). */
  popup?: boolean;
};

/** Run work after the response is sent when we're in a request; inline otherwise. */
export function later(task: () => Promise<unknown>) {
  try {
    after(() => task().catch((e) => console.error("[later]", e)));
  } catch {
    void task().catch((e) => console.error("[later]", e));
  }
}

/**
 * In-app notification for each user (bell + live popup), plus a web push
 * where the user has allowed it. Returns how many users were notified.
 */
export async function notifyUsers(userIds: (string | null | undefined)[], n: NotifyInput) {
  const ids = [...new Set(userIds.filter((x): x is string => Boolean(x)))];
  if (!ids.length) return 0;

  for (let i = 0; i < ids.length; i += 500) {
    await db.insert(notifications).values(
      ids.slice(i, i + 500).map((userId) => ({
        userId,
        kind: n.kind,
        title: n.title.slice(0, 140),
        body: n.body?.slice(0, 600) ?? null,
        url: n.url ?? null,
        popup: n.popup ?? true,
      }))
    );
  }

  if (n.popup !== false) {
    later(() => pushToUsers(ids, { title: n.title, body: n.body ?? undefined, url: n.url ?? "/notifications", tag: n.kind }));
  }
  return ids.length;
}

/** Different content per user in one insert — used for bulk decisions. */
export async function notifyEach(items: ({ userId: string | null | undefined } & NotifyInput)[]) {
  const list = items.filter((i): i is { userId: string } & NotifyInput => Boolean(i.userId));
  if (!list.length) return 0;
  for (let i = 0; i < list.length; i += 500) {
    await db.insert(notifications).values(
      list.slice(i, i + 500).map((n) => ({
        userId: n.userId,
        kind: n.kind,
        title: n.title.slice(0, 140),
        body: n.body?.slice(0, 600) ?? null,
        url: n.url ?? null,
        popup: n.popup ?? true,
      }))
    );
  }
  const loud = list.filter((n) => n.popup !== false);
  if (loud.length) {
    later(async () => {
      for (const n of loud) {
        await pushToUsers([n.userId], { title: n.title, body: n.body ?? undefined, url: n.url ?? "/notifications", tag: n.kind });
      }
    });
  }
  return list.length;
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getUser } from "@/lib/session";
import { and, asc, count, desc, eq, gte, isNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET                → latest 40 + unread count (the bell / notifications page)
 * GET ?popup=1       → unread popup-worthy ones from the last 2 days, so a
 *                      decision made while the app was closed still pops up.
 */
export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });

  const popupOnly = new URL(req.url).searchParams.get("popup") === "1";
  const [{ n: unread }] = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  const items = popupOnly
    ? await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, user.id),
            isNull(notifications.readAt),
            eq(notifications.popup, true),
            gte(notifications.createdAt, new Date(Date.now() - 48 * 3600e3))
          )
        )
        .orderBy(asc(notifications.createdAt))
        .limit(5)
    : await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(40);

  return NextResponse.json({ items, unread });
}

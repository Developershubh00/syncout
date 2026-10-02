import { db } from "@/db";
import { bookings, notifications, ticketOrders } from "@/db/schema";
import { getUser } from "@/lib/session";
import { and, asc, count, eq, inArray, sql } from "drizzle-orm";
import { rowsOf } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fast tick while a decision could land; slow tick otherwise. */
const HOT_MS = Number(process.env.LIVE_POLL_MS ?? process.env.NEXT_PUBLIC_LIVE_POLL_MS ?? 3000);
const IDLE_MS = 15_000;
// Stay under the platform's function ceiling, then let EventSource reconnect.
const MAX_LIFETIME_MS = 50_000;

async function waiting(userId: string) {
  const [[b], [o]] = await Promise.all([
    db.select({ n: count() }).from(bookings).where(and(eq(bookings.userId, userId), eq(bookings.status, "pending"))),
    db
      .select({ n: count() })
      .from(ticketOrders)
      .where(and(eq(ticketOrders.userId, userId), inArray(ticketOrders.status, ["awaiting_payment", "payment_submitted"]))),
  ]);
  return b.n + o.n > 0;
}

/** One indexed query: this user's notifications newer than the cursor. */
async function newer(userId: string, since: string) {
  return db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      url: notifications.url,
      popup: notifications.popup,
      // Full-precision text, so the cursor never re-sends a row.
      at: sql<string>`${notifications.createdAt}::text`,
    })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), sql`${notifications.createdAt} > ${since}::timestamptz`))
    .orderBy(asc(notifications.createdAt))
    .limit(20);
}

export async function GET() {
  const user = await getUser();
  if (!user) return new Response(null, { status: 204 });

  const encoder = new TextEncoder();
  const started = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      let since: string;
      let hot: boolean;
      try {
        since = rowsOf<{ now: string }>(await db.execute(sql`select now()::text as now`))[0].now;
        hot = await waiting(user.id);
      } catch {
        send("error", { message: "cannot reach the database" });
        controller.close();
        return;
      }
      send("ready", { hot });

      let tick = 0;
      while (!closed && Date.now() - started < MAX_LIFETIME_MS) {
        await new Promise((r) => setTimeout(r, hot ? HOT_MS : IDLE_MS));
        if (Date.now() - started >= MAX_LIFETIME_MS) break;
        try {
          const rows = await newer(user.id, since);
          for (const r of rows) {
            send("notification", { id: r.id, kind: r.kind, title: r.title, body: r.body, url: r.url, popup: r.popup });
            since = r.at;
          }
          if (rows.length || ++tick % 4 === 0) hot = await waiting(user.id);
        } catch {
          // A transient database blip shouldn't kill the stream.
        }
        send("ping", { t: Date.now() });
      }

      closed = true;
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getUser } from "@/lib/session";
import { eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fast tick while a decision could land; slow tick when nothing is pending. */
const HOT_MS = Number(process.env.LIVE_POLL_MS ?? 2000);
const IDLE_MS = 20_000;
const MAX_LIFETIME_MS = 50_000;

/**
 * Deliberately narrow: two columns, one indexed predicate, no joins.
 * This runs on a timer so its cost is the thing that matters most.
 */
async function statuses(userId: string) {
  return db
    .select({ id: bookings.id, status: bookings.status })
    .from(bookings)
    .where(eq(bookings.userId, userId));
}

/** Only called when something actually changed, so the joins are affordable. */
async function detailsFor(ids: string[]) {
  if (!ids.length) return [];
  return db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      rejectionReason: bookings.rejectionReason,
      eventTitle: events.title,
      clubName: clubs.name,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(inArray(bookings.id, ids));
}

export async function GET() {
  const user = await getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

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

      let previous = new Map<string, string>();
      try {
        for (const r of await statuses(user.id)) previous.set(r.id, r.status);
      } catch {
        send("error", { message: "cannot reach the database" });
        controller.close();
        return;
      }

      const anyPending = () => [...previous.values()].some((s) => s === "pending");
      send("ready", { watching: previous.size, pending: anyPending() });

      while (!closed && Date.now() - started < MAX_LIFETIME_MS) {
        await new Promise((r) => setTimeout(r, anyPending() ? HOT_MS : IDLE_MS));
        if (Date.now() - started >= MAX_LIFETIME_MS) break;

        try {
          const rows = await statuses(user.id);
          const changed = rows
            .filter((r) => previous.has(r.id) && previous.get(r.id) !== r.status)
            .map((r) => r.id);

          if (changed.length) {
            for (const d of await detailsFor(changed)) {
              send("status", {
                id: d.id,
                code: d.code,
                status: d.status,
                reason: d.rejectionReason,
                eventTitle: d.eventTitle,
                clubName: d.clubName,
              });
            }
          }
          previous = new Map(rows.map((r) => [r.id, r.status]));
        } catch {
          // A transient Neon blip shouldn't kill the stream.
        }
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

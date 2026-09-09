import { db } from "@/db";
import { bookings, events, clubs } from "@/db/schema";
import { getUser } from "@/lib/session";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_MS = Number(process.env.LIVE_POLL_MS ?? 2500);
// Stay under the platform's function ceiling, then let EventSource reconnect.
const MAX_LIFETIME_MS = 50_000;

type Snapshot = Record<string, string>;

async function snapshot(userId: string) {
  const rows = await db
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
    .where(eq(bookings.userId, userId));

  const map: Snapshot = {};
  for (const r of rows) map[r.id] = r.status;
  return { rows, map };
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

      let previous: Snapshot;
      try {
        previous = (await snapshot(user.id)).map;
      } catch {
        send("error", { message: "cannot reach the database" });
        controller.close();
        return;
      }

      send("ready", { watching: Object.keys(previous).length });

      while (!closed && Date.now() - started < MAX_LIFETIME_MS) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        try {
          const { rows, map } = await snapshot(user.id);
          for (const row of rows) {
            const before = previous[row.id];
            if (before && before !== row.status) {
              send("status", {
                id: row.id,
                code: row.code,
                from: before,
                status: row.status,
                reason: row.rejectionReason,
                eventTitle: row.eventTitle,
                clubName: row.clubName,
              });
            }
          }
          previous = map;
        } catch {
          // A transient Neon blip shouldn't kill the stream.
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

import { NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, ticketOrders, users } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { notifySchema } from "@/lib/validators";
import { notifyUsers, later } from "@/lib/notify";
import { sendMany, broadcastEmail } from "@/lib/mail";
import { readJson, fail, guard } from "@/lib/api";
import { z } from "zod";

type Contact = { userId: string | null; name: string; phone: string | null; email: string | null };

const NIGHT_DEFAULT = ["approved", "checked_in", "pending"];
const EVENT_DEFAULT = ["confirmed", "checked_in", "payment_submitted", "awaiting_payment"];

async function recipients(d: { audience: string; targetId?: string | null; statuses: string[] }): Promise<Contact[]> {
  if (d.audience === "night") {
    if (!d.targetId) return [];
    const st = d.statuses.length ? d.statuses : NIGHT_DEFAULT;
    return db
      .select({ userId: bookings.userId, name: bookings.guestName, phone: bookings.guestPhone, email: bookings.guestEmail })
      .from(bookings)
      .where(and(eq(bookings.eventId, d.targetId), inArray(bookings.status, st as ("pending" | "approved")[])));
  }
  if (d.audience === "event") {
    if (!d.targetId) return [];
    const st = d.statuses.length ? d.statuses : EVENT_DEFAULT;
    return db
      .select({ userId: ticketOrders.userId, name: ticketOrders.name, phone: ticketOrders.phone, email: ticketOrders.email })
      .from(ticketOrders)
      .where(and(eq(ticketOrders.eventId, d.targetId), inArray(ticketOrders.status, st as ("confirmed")[])));
  }
  return db
    .select({ userId: users.id, name: users.name, phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.isBlocked, false));
}

/**
 * Message booked guests. ?dry=1 only returns who would get it (and the
 * contact list for WhatsApp/calls) without sending anything.
 */
export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const dry = new URL(req.url).searchParams.get("dry") === "1";
  // A preview only needs the audience — don't make the admin write a title first.
  const schema = dry ? notifySchema.extend({ title: z.string().max(120).default("Preview") }) : notifySchema;
  const parsed = schema.safeParse(await readJson(req));
  if (!parsed.success) return fail(parsed.error.issues[0].message, 422);
  const d = parsed.data;

  const raw = await recipients(d);
  const seen = new Set<string>();
  const contacts = raw.filter((c) => {
    const key = (c.phone || c.email || c.userId || "").toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const userIds = [...new Set(raw.map((c) => c.userId).filter((x): x is string => Boolean(x)))];
  const emails = [...new Map(raw.filter((c) => c.email).map((c) => [c.email!.toLowerCase(), c])).values()];

  const counts = { people: contacts.length, inApp: userIds.length, emails: emails.length };
  if (dry) return NextResponse.json({ ok: true, dry: true, counts, contacts: contacts.slice(0, 1000) });

  let inApp = 0;
  if (d.channels.inApp && userIds.length) {
    inApp = await notifyUsers(userIds, { kind: "broadcast", title: d.title, body: d.body || null, url: d.url || "/notifications" });
  }
  if (d.channels.email && emails.length) {
    later(() =>
      sendMany(
        emails.map((c) => ({
          to: c.email!,
          subject: d.title,
          html: broadcastEmail({ name: c.name, title: d.title, body: d.body, url: d.url }),
        }))
      )
    );
  }
  return NextResponse.json({ ok: true, counts: { ...counts, inAppSent: inApp }, contacts: contacts.slice(0, 1000) });
}

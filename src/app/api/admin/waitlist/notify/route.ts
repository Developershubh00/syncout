import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { ticketedEvents, waitlist } from "@/db/schema";
import { getAdmin } from "@/lib/session";
import { readJson, fail, guard } from "@/lib/api";
import { notifyUsers, later } from "@/lib/notify";
import { sendMail, esc } from "@/lib/mail";
import { absUrl } from "@/lib/site";
import { guestWaLink } from "@/lib/whatsapp";
import { dayLabel } from "@/lib/event-format";

/** Tells everyone waiting for an event that spots are open: in-app + push, email, and a WhatsApp list for the rest. */
export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  if (!(await getAdmin())) return fail("Unauthorized", 401);
  const parsed = z.object({ eventId: z.string().uuid(), message: z.string().trim().max(300).optional() }).safeParse(await readJson(req));
  if (!parsed.success) return fail("Pick an event", 422);
  const [ev] = await db.select({ id: ticketedEvents.id, title: ticketedEvents.title, slug: ticketedEvents.slug }).from(ticketedEvents).where(eq(ticketedEvents.id, parsed.data.eventId)).limit(1);
  if (!ev) return fail("Event not found", 404);
  const rows = await db.select().from(waitlist).where(and(eq(waitlist.eventId, ev.id), eq(waitlist.status, "waiting")));
  if (!rows.length) return NextResponse.json({ ok: true, notified: 0, whatsapp: [] });

  const url = `/events/${ev.slug}`;
  const text = parsed.data.message || `Spots just opened for ${ev.title}. Book now before they go again.`;
  const userIds = [...new Set(rows.map((r) => r.userId).filter((x): x is string => Boolean(x)))];
  if (userIds.length) await notifyUsers(userIds, { kind: "broadcast", title: `Tickets available: ${ev.title}`, body: text, url, popup: true }).catch(() => {});
  for (const r of rows.filter((r) => r.email)) {
    later(() =>
      sendMail({
        to: r.email!,
        subject: `Tickets available — ${ev.title}`,
        html: `<p>Hi ${esc(r.name)},</p><p>${esc(text)}</p><p><a href="${esc(absUrl(url))}">Book now</a></p>`,
      })
    );
  }
  await db.update(waitlist).set({ status: "notified", notifiedAt: new Date() }).where(inArray(waitlist.id, rows.map((r) => r.id)));

  const whatsapp = rows.map((r) => ({
    name: r.name,
    phone: r.phone,
    detail: [r.tierName, r.day ? dayLabel(r.day) : null, `×${r.quantity}`].filter(Boolean).join(" · "),
    link: guestWaLink(r.phone, `Hi ${r.name.split(" ")[0]}, ${text} ${absUrl(url)}`),
  }));
  return NextResponse.json({ ok: true, notified: rows.length, inApp: userIds.length, whatsapp });
}

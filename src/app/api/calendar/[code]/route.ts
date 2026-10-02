import { getAdmin, getUser } from "@/lib/session";
import { hasAccess, passPath, ticketPath } from "@/lib/access";
import { getBookingByCode } from "@/lib/queries";
import { getOrder } from "@/lib/tevents";
import { icsFile } from "@/lib/calendar";
import { istAt } from "@/lib/guestlist";
import { absUrl } from "@/lib/site";
import { cityName } from "@/lib/cities";

export const dynamic = "force-dynamic";

/** .ics for a confirmed ticket or an approved pass. Same access rule as the pages. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = (await params).code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const k = new URL(req.url).searchParams.get("k");
  const [user, admin] = await Promise.all([getUser(), getAdmin()]);

  let file: string | null = null;
  if (code.length === 7 && code.startsWith("T")) {
    const o = await getOrder(code);
    if (o && (admin || (user && o.userId === user.id) || hasAccess("ticket", code, k))) {
      const base = new Date(o.startsAt);
      const ist = new Date(base.getTime() + 330 * 60000);
      const start = o.day ? istAt(o.day, ist.getUTCHours(), ist.getUTCMinutes()) : base;
      file = icsFile({
        uid: `${o.code}@syncout`,
        title: o.eventTitle,
        start,
        end: new Date(start.getTime() + 5 * 3600e3),
        location: `${o.venueName}, ${cityName(o.citySlug)}`,
        details: `Booking ${o.code} · ${o.quantity} × ${o.tierName}. Show your ticket QR at the entry.`,
        url: absUrl(ticketPath(o.code)),
      });
    }
  } else {
    const b = await getBookingByCode(code);
    if (b && (admin || (b.userId && user?.id === b.userId) || hasAccess("pass", code, k))) {
      const start = new Date(b.startsAt);
      file = icsFile({
        uid: `${b.code}@syncout`,
        title: `${b.eventTitle} — ${b.clubName}`,
        start,
        end: new Date(start.getTime() + 4 * 3600e3),
        location: [b.clubName, b.clubAddress ?? b.clubArea].filter(Boolean).join(", "),
        details: `Guestlist pass ${b.code} for ${b.totalGuests}. Reach by ${b.arrivalTime ?? "10:30 PM"}. Carry a photo ID.`,
        url: absUrl(passPath(b.code)),
      });
    }
  }
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(file, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="syncout-${code}.ics"` },
  });
}

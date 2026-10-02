import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getAdmin } from "@/lib/session";
import { rowsOf } from "@/lib/api";

export const dynamic = "force-dynamic";

type Ev = { kind: "order" | "payment" | "guestlist"; key: string; at: string; title: string; body: string; url: string };
const rs = (n: number) => "₹" + Number(n).toLocaleString("en-IN");

/** What happened since `after`: new event bookings, payment proofs, guestlist requests. Polled by the admin panel. */
export async function GET(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const raw = new URL(req.url).searchParams.get("after");
  const after = raw && !Number.isNaN(Date.parse(raw)) ? new Date(raw) : new Date(Date.now() - 60_000);
  const since = after.toISOString();
  const [orders, payments, guests] = await Promise.all([
    db.execute(sql`
      select o.code, o.created_at as at, o.amount, o.quantity, o.tier_name, o.name, o.mode, e.title
      from ticket_orders o join ticketed_events e on e.id = o.event_id
      where o.created_at > ${since}::timestamptz order by o.created_at desc limit 12`).then(rowsOf).catch(() => []),
    db.execute(sql`
      select o.code, o.whatsapp_at as at, o.amount, o.name, o.status, e.title
      from ticket_orders o join ticketed_events e on e.id = o.event_id
      where o.whatsapp_at > ${since}::timestamptz order by o.whatsapp_at desc limit 12`).then(rowsOf).catch(() => []),
    db.execute(sql`
      select b.code, b.created_at as at, b.guest_name as name, b.total_guests, ev.title, c.name as club
      from bookings b join events ev on ev.id = b.event_id join clubs c on c.id = b.club_id
      where b.created_at > ${since}::timestamptz order by b.created_at desc limit 12`).then(rowsOf).catch(() => []),
  ]);
  const out: Ev[] = [
    ...(orders as Record<string, unknown>[]).map((o) => ({
      kind: "order" as const, key: `o:${o.code}`, at: String(o.at),
      title: Number(o.amount) > 0 ? `New booking · ${rs(Number(o.amount))}` : "New free booking",
      body: `${o.title} · ${o.quantity} × ${o.tier_name} — ${o.name}`, url: `/admin/tickets/${o.code}`,
    })),
    ...(payments as Record<string, unknown>[]).map((o) => ({
      kind: "payment" as const, key: `p:${o.code}:${o.at}`, at: String(o.at),
      title: o.status === "payment_submitted" ? `Payment to verify · ${rs(Number(o.amount))}` : "Customer messaged on WhatsApp",
      body: `${o.title} — ${o.name} (${o.code})`, url: o.status === "payment_submitted" ? "/admin/orders?status=payment_submitted" : `/admin/tickets/${o.code}`,
    })),
    ...(guests as Record<string, unknown>[]).map((b) => ({
      kind: "guestlist" as const, key: `g:${b.code}`, at: String(b.at),
      title: "New guestlist request", body: `${b.title} at ${b.club} — ${b.name}, ${b.total_guests} people`, url: "/admin/bookings?status=pending",
    })),
  ].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return NextResponse.json({ now: new Date().toISOString(), events: out.slice(0, 20) });
}

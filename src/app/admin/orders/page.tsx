import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { adminOrders, adminEvents } from "@/lib/tevents";
import { OrderRow } from "@/components/admin/OrderRow";
import { EventFilter } from "@/components/admin/EventFilter";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { rs } from "@/lib/event-format";

export const dynamic = "force-dynamic";

const FILTERS = [
  ["payment_submitted", "To verify"],
  ["awaiting_payment", "Awaiting payment"],
  ["confirmed", "Confirmed"],
  ["checked_in", "Checked in"],
  ["rejected", "Rejected"],
  ["all", "All"],
] as const;

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; event?: string; q?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const { status = "payment_submitted", event, q } = await searchParams;
  const [rows, events] = await Promise.all([adminOrders({ status: q ? "all" : status, eventId: event, q }), adminEvents()]);
  const total = rows.filter((r) => r.status === "confirmed" || r.status === "checked_in").reduce((n, r) => n + r.amount, 0);

  return (
    <div className="pt-6">
      <div className="flex flex-wrap items-center gap-3 px-4 lg:px-0">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Event bookings</h1>
        <div className="ml-auto flex gap-2">
          {event && (
            <Link href={`/admin/notify?audience=event&target=${event}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold">
              Message ticket holders
            </Link>
          )}
          <a href={`/api/admin/orders/export${event ? `?event=${event}` : ""}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold">
            Export CSV
          </a>
        </div>
      </div>
      <p className="mt-1.5 px-4 text-[12.5px] text-muted lg:px-0">
        Match the UTR or the WhatsApp screenshot against your UPI app, then Confirm — the guest gets a notification, email and their ticket code.
      </p>

      <div className="mt-3 px-4 lg:px-0">
        <EventFilter options={events.map((e) => ({ id: e.id, title: e.title, toVerify: e.stats.toVerify, orders: e.stats.orders }))} value={event} status={status} />
        <AdminSearch placeholder="Find by name, phone, code or UTR" />
      </div>

      <div className="rail chips py-3.5">
        {FILTERS.map(([f, label]) => (
          <Link
            key={f}
            href={`/admin/orders?status=${f}${event ? `&event=${event}` : ""}`}
            className={"rounded-full border px-3.5 py-1.5 text-[13px] " + (f === status ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")}
          >
            {label}
          </Link>
        ))}
      </div>

      {total > 0 && <p className="px-4 pb-2 text-[12.5px] text-muted lg:px-0">Confirmed in this view: <b className="text-gold">{rs(total)}</b></p>}

      {rows.length === 0 ? (
        <p className="mx-4 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted lg:mx-0">Nothing here.</p>
      ) : (
        <ul className="space-y-2.5 px-4 lg:px-0">
          {rows.map((o) => (
            <OrderRow
              key={o.id}
              o={{
                id: o.id, code: o.code, status: o.status, mode: o.mode, name: o.name, phone: o.phone, email: o.email,
                eventTitle: o.eventTitle, day: o.day, tierName: o.tierName, quantity: o.quantity, admits: o.admits,
                amount: o.amount, utr: o.utr, note: o.note, adminNote: o.adminNote,
                whatsappAt: o.whatsappAt ? String(o.whatsappAt) : null, createdAt: String(o.createdAt), hasAccount: Boolean(o.userId),
                photos: (o.photos ?? []) as string[],
              }}
            />
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}

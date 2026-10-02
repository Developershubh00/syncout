import Link from "next/link";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { rowsOf } from "@/lib/api";
import { rs, shortDayLabel, todayKey } from "@/lib/event-format";

export const dynamic = "force-dynamic";
const PAID = sql`('confirmed', 'checked_in')`;
const q = async <T,>(query: ReturnType<typeof sql>) => rowsOf<T>(await db.execute(query).catch(() => ({ rows: [] }))) as T[];

export default async function AdminSales() {
  if (!(await getAdmin())) redirect("/admin");
  const [[k], days, events, promos, tiers] = await Promise.all([
    q<Record<string, number | string>>(sql`
      select coalesce(sum(amount) filter (where status in ${PAID}), 0)::int as revenue,
             coalesce(sum(amount) filter (where status = 'payment_submitted'), 0)::int as pending,
             coalesce(sum(admits) filter (where status in ${PAID}), 0)::int as people,
             coalesce(sum(jsonb_array_length(admitted)), 0)::int as checked_in,
             coalesce(sum(discount) filter (where status in ${PAID}), 0)::int as discounts,
             count(*) filter (where status in ${PAID})::int as orders
      from ticket_orders`),
    q<{ day: string; revenue: number; people: number }>(sql`
      select to_char((created_at at time zone 'Asia/Kolkata')::date, 'YYYY-MM-DD') as day,
             coalesce(sum(amount), 0)::int as revenue, coalesce(sum(admits), 0)::int as people
      from ticket_orders where status in ${PAID} and created_at > now() - interval '14 days' group by 1 order by 1`),
    q<{ id: string; title: string; slug: string; orders: number; people: number; revenue: number; checked_in: number; to_verify: number; waiting: number }>(sql`
      select e.id, e.title, e.slug,
             count(o.id) filter (where o.status in ${PAID})::int as orders,
             coalesce(sum(o.admits) filter (where o.status in ${PAID}), 0)::int as people,
             coalesce(sum(o.amount) filter (where o.status in ${PAID}), 0)::int as revenue,
             coalesce(sum(jsonb_array_length(o.admitted)), 0)::int as checked_in,
             count(o.id) filter (where o.status = 'payment_submitted')::int as to_verify,
             (select count(*) from waitlist w where w.event_id = e.id and w.status = 'waiting')::int as waiting
      from ticketed_events e left join ticket_orders o on o.event_id = e.id
      group by e.id order by revenue desc, e.starts_at asc limit 40`),
    q<{ code: string; orders: number; revenue: number; discount: number }>(sql`
      select promo_code as code, count(*)::int as orders, coalesce(sum(amount), 0)::int as revenue, coalesce(sum(discount), 0)::int as discount
      from ticket_orders where promo_code is not null and status in ${PAID} group by promo_code order by revenue desc limit 10`),
    q<{ name: string; title: string; sold: number; capacity: number | null }>(sql`
      select t.name, e.title, coalesce(sum(o.quantity) filter (where o.status in ${PAID}), 0)::int as sold, t.capacity
      from ticket_tiers t join ticketed_events e on e.id = t.event_id left join ticket_orders o on o.tier_id = t.id
      group by t.id, e.title order by sold desc limit 12`),
  ]);

  const today = todayKey();
  const series = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.parse(`${today}T12:00:00+05:30`) - (13 - i) * 864e5);
    const key = new Date(d.getTime() + 330 * 60000).toISOString().slice(0, 10);
    const hit = days.find((x) => x.day === key);
    return { key, revenue: Number(hit?.revenue ?? 0), people: Number(hit?.people ?? 0) };
  });
  const top = Math.max(1, ...series.map((s) => s.revenue));
  const kpi = (n: unknown) => Number(n ?? 0);

  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Sales</h1>
      <p className="mt-1 text-[12.5px] text-muted">Event ticket sales. Paid = confirmed or checked in.</p>

      <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-6">
        {[
          ["Paid revenue", rs(kpi(k?.revenue))],
          ["To verify", rs(kpi(k?.pending))],
          ["People booked", kpi(k?.people)],
          ["Checked in", kpi(k?.checked_in)],
          ["Paid orders", kpi(k?.orders)],
          ["Discounts given", rs(kpi(k?.discounts))],
        ].map(([label, v]) => (
          <div key={String(label)} className="rounded-[18px] border border-line bg-surface p-4">
            <p className="font-display text-[22px] font-extrabold">{v}</p>
            <p className="mt-0.5 text-[12px] text-muted">{label}</p>
          </div>
        ))}
      </div>

      <section className="mt-6 rounded-[20px] border border-line bg-surface p-4">
        <h2 className="text-[16px]">Last 14 days</h2>
        <div className="mt-4 flex h-40 items-end gap-1.5">
          {series.map((s) => (
            <div key={s.key} className="group relative flex h-full flex-1 flex-col justify-end">
              <div className="rounded-t-md bg-gradient-to-t from-[#e4113c] to-[#ff2bd6] transition-opacity group-hover:opacity-80" style={{ height: `${Math.max(2, (s.revenue / top) * 100)}%` }} title={`${s.key}: ${rs(s.revenue)} · ${s.people} people`} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5 text-[9.5px] text-faint">
          {series.map((s, i) => <span key={s.key} className="flex-1 text-center">{i % 2 === 0 ? shortDayLabel(s.key) : ""}</span>)}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-[16px]">By event</h2>
        <div className="mt-3 overflow-x-auto rounded-[18px] border border-line">
          <table className="w-full min-w-[640px] text-[13px]">
            <thead className="bg-raised text-left text-[11.5px] text-faint">
              <tr><th className="p-3">Event</th><th className="p-3">Paid orders</th><th className="p-3">People</th><th className="p-3">Revenue</th><th className="p-3">In</th><th className="p-3">To verify</th><th className="p-3">Waiting</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="p-3"><Link href={`/admin/orders?status=all&event=${e.id}`} className="hover:underline">{e.title}</Link></td>
                  <td className="p-3">{e.orders}</td>
                  <td className="p-3">{e.people}</td>
                  <td className="p-3 font-semibold">{rs(Number(e.revenue))}</td>
                  <td className="p-3">{Number(e.people) ? `${Math.round((Number(e.checked_in) / Number(e.people)) * 100)}%` : "—"}</td>
                  <td className="p-3">{Number(e.to_verify) ? <Link href={`/admin/orders?status=payment_submitted&event=${e.id}`} className="text-gold underline">{e.to_verify}</Link> : 0}</td>
                  <td className="p-3">{Number(e.waiting) ? <Link href={`/admin/waitlist?event=${e.id}`} className="underline">{e.waiting}</Link> : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-[20px] border border-line bg-surface p-4">
          <h2 className="text-[16px]">Promo codes</h2>
          {promos.length ? (
            <ul className="mt-3 space-y-2 text-[13px]">
              {promos.map((p) => (
                <li key={p.code} className="flex items-center justify-between rounded-xl bg-raised px-3 py-2">
                  <span className="font-semibold">{p.code}</span>
                  <span className="text-muted">{p.orders} orders · {rs(Number(p.revenue))} · −{rs(Number(p.discount))}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-2 text-[13px] text-muted">No paid orders with a code yet.</p>}
        </section>
        <section className="rounded-[20px] border border-line bg-surface p-4">
          <h2 className="text-[16px]">Ticket types</h2>
          <ul className="mt-3 space-y-2.5 text-[13px]">
            {tiers.map((t, i) => (
              <li key={i}>
                <div className="flex justify-between gap-3"><span className="truncate">{t.name} · <span className="text-muted">{t.title}</span></span><span className="shrink-0 font-semibold">{t.sold}{t.capacity ? ` / ${t.capacity} a day` : ""}</span></div>
                {t.capacity ? <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-raised"><div className="h-full rounded-full bg-gold" style={{ width: `${Math.min(100, (Number(t.sold) / Number(t.capacity)) * 100)}%` }} /></div> : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="h-10" />
    </div>
  );
}

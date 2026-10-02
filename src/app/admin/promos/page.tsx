import { redirect } from "next/navigation";
import { asc, desc, sql } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { promoCodes, ticketedEvents } from "@/db/schema";
import { PromoManager } from "@/components/admin/PromoManager";
import { rowsOf } from "@/lib/api";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminPromos() {
  if (!(await getAdmin())) redirect("/admin");
  const [promos, events, stats] = await Promise.all([
    db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt)).catch(() => []),
    db.select({ id: ticketedEvents.id, title: ticketedEvents.title, slug: ticketedEvents.slug }).from(ticketedEvents).orderBy(asc(ticketedEvents.startsAt)).catch(() => []),
    db
      .execute(sql`
        select promo_code as code,
          count(*) filter (where status in ('confirmed', 'checked_in'))::int as orders,
          coalesce(sum(amount) filter (where status in ('confirmed', 'checked_in')), 0)::int as revenue,
          coalesce(sum(discount) filter (where status in ('confirmed', 'checked_in')), 0)::int as discount
        from ticket_orders where promo_code is not null group by promo_code`)
      .then((r) => rowsOf<{ code: string; orders: number; revenue: number; discount: number }>(r))
      .catch(() => []),
  ]);
  const by = new Map(stats.map((s) => [s.code, s]));
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Promo codes</h1>
      <p className="mb-5 mt-1 text-[12.5px] text-muted">One code per influencer or ad — the copied link applies the code by itself, and sales show up here.</p>
      <PromoManager
        origin={SITE.url}
        events={events}
        promos={promos.map((p) => ({
          ...p,
          startsAt: p.startsAt ? String(p.startsAt.toISOString()) : null,
          endsAt: p.endsAt ? String(p.endsAt.toISOString()) : null,
          orders: Number(by.get(p.code)?.orders ?? 0),
          revenue: Number(by.get(p.code)?.revenue ?? 0),
          discount: Number(by.get(p.code)?.discount ?? 0),
        }))}
      />
      <div className="h-10" />
    </div>
  );
}

import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { MessageCircle } from "lucide-react";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { ticketedEvents, waitlist } from "@/db/schema";
import { NotifyWaitlist, WaitRowActions } from "@/components/admin/WaitlistTools";
import { EventFilter } from "@/components/admin/EventFilter";
import { guestWaLink } from "@/lib/whatsapp";
import { dayLabel } from "@/lib/event-format";

export const dynamic = "force-dynamic";

export default async function AdminWaitlist({ searchParams }: { searchParams: Promise<{ event?: string; status?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const { event, status = "waiting" } = await searchParams;
  const counts = await db
    .select({ id: ticketedEvents.id, title: ticketedEvents.title, waiting: sql<number>`count(${waitlist.id}) filter (where ${waitlist.status} = 'waiting')`.mapWith(Number), total: sql<number>`count(${waitlist.id})`.mapWith(Number) })
    .from(ticketedEvents)
    .innerJoin(waitlist, eq(waitlist.eventId, ticketedEvents.id))
    .groupBy(ticketedEvents.id, ticketedEvents.title)
    .orderBy(desc(sql`count(${waitlist.id})`))
    .catch(() => []);
  const rows = await db
    .select()
    .from(waitlist)
    .where(and(event ? eq(waitlist.eventId, event) : undefined, status === "all" ? undefined : eq(waitlist.status, status)))
    .orderBy(desc(waitlist.createdAt))
    .limit(300)
    .catch(() => []);
  const current = counts.find((c) => c.id === event);

  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Waitlist</h1>
      <p className="mt-1 text-[12.5px] text-muted">People who asked to be told when a sold-out ticket opens up.</p>
      <div className="mt-4">
        <EventFilter options={counts.map((c) => ({ id: c.id, title: c.title, toVerify: c.waiting, orders: c.total }))} value={event} status={status} basePath="/admin/waitlist" noun="waiting" />
      </div>
      {current && <div className="mt-4"><NotifyWaitlist eventId={current.id} waiting={current.waiting} /></div>}
      {!event && counts.length > 0 && <p className="mt-3 text-[12.5px] text-faint">Pick an event above to notify its waitlist.</p>}
      <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-[18px] border border-line bg-surface p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{r.name} <span className="text-[12px] font-normal text-muted">×{r.quantity}</span></p>
                <p className="mt-0.5 truncate text-[12px] text-muted">{[r.tierName, r.day ? dayLabel(r.day) : null, r.status].filter(Boolean).join(" · ")}</p>
              </div>
              <WaitRowActions id={r.id} status={r.status} />
            </div>
            <a href={guestWaLink(r.phone, `Hi ${r.name.split(" ")[0]}, this is SyncOut about your waitlist request.`)} target="_blank" rel="noreferrer" className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-2.5 text-[12.5px] text-[#25D366]">
              <MessageCircle className="size-3.5" /> {r.phone}
            </a>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="mt-6 text-center text-[13px] text-muted">Nobody waiting here.</p>}
      <div className="h-10" />
    </div>
  );
}

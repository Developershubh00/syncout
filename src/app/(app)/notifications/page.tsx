import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Check, X, Megaphone, Clock, Ticket } from "lucide-react";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getUser } from "@/lib/session";
import { MarkAllRead } from "@/components/notify/MarkAllRead";
import { PushToggle } from "@/components/pwa/PushToggle";
import { Empty } from "@/components/Empty";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

const ICON: Record<string, typeof Bell> = { approved: Check, confirmed: Check, rejected: X, waitlisted: Clock, broadcast: Megaphone, receipt: Ticket, info: Bell };

function ago(d: Date) {
  const s = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) {
    return (
      <div className="pt-6">
        <Empty title="Log in to see notifications" body="Approvals, ticket confirmations and announcements land here." cta={{ href: "/login", label: "Log in" }} />
      </div>
    );
  }

  const list = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(60)
    .catch(() => []);

  return (
    <>
      <MarkAllRead any={list.some((n) => !n.readAt)} />
      <header className="px-4 pb-3 pt-5 lg:px-0">
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Notifications</h1>
      </header>
      <div className="mx-4 mb-4 overflow-hidden rounded-[18px] border border-line bg-surface lg:mx-0">
        <PushToggle />
      </div>
      {list.length === 0 ? (
        <Empty title="Nothing yet" body="You'll hear from us here the moment you're approved or your tickets are confirmed." />
      ) : (
        <ul className="space-y-2.5 px-4 lg:px-0">
          {list.map((n) => {
            const Icon = ICON[n.kind] ?? Bell;
            const good = n.kind === "approved" || n.kind === "confirmed";
            const body = (
              <div className={`flex gap-3 rounded-[18px] border p-3.5 ${n.readAt ? "border-line bg-surface" : "border-red/30 bg-red/[0.05]"}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ${good ? "bg-gold/15 text-gold" : n.kind === "rejected" ? "bg-red/12 text-red-hot" : "bg-raised text-muted"}`}>
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[14px] font-semibold leading-snug">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-faint">{ago(n.createdAt)}</span>
                  </div>
                  {n.body && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{n.body}</p>}
                </div>
              </div>
            );
            return <li key={n.id}>{n.url ? <Link href={n.url}>{body}</Link> : body}</li>;
          })}
        </ul>
      )}
      <div className="h-8" />
    </>
  );
}

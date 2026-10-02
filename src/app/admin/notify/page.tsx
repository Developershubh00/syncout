import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { adminNightOptions } from "@/lib/queries";
import { adminEvents } from "@/lib/tevents";
import { pushEnabled } from "@/lib/push";
import { NotifyComposer } from "@/components/admin/NotifyComposer";
import { friendlyDate, fmtTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminNotify({ searchParams }: { searchParams: Promise<{ audience?: string; target?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const [{ audience, target }, nights, events] = await Promise.all([searchParams, adminNightOptions(), adminEvents()]);
  const mailOn = process.env.MAIL_ENABLED === "true" && Boolean(process.env.RESEND_API_KEY);

  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Message guests</h1>
      <p className="mt-1 max-w-[64ch] text-[12.5px] text-muted">
        Reach everyone booked for a night or an event — as a popup and bell notification (plus a phone push where they allowed it),
        by email, or one by one on WhatsApp.
      </p>
      <div className="mt-5 max-w-[860px]">
        <NotifyComposer
          nights={nights.map((n) => ({ id: n.id, label: `${friendlyDate(n.startsAt)} ${fmtTime(n.startsAt)} · ${n.clubName} · ${n.title} (${n.total})` }))}
          events={events.map((e) => ({ id: e.id, label: `${e.title} (${e.stats.orders})` }))}
          initialAudience={audience}
          initialTarget={target}
          mailOn={mailOn}
          pushOn={pushEnabled()}
        />
      </div>
      <div className="h-10" />
    </div>
  );
}

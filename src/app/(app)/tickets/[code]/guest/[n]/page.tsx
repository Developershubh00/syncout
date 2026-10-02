import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Lock, Check, MapPin, CalendarDays } from "lucide-react";
import { getOrder } from "@/lib/tevents";
import { getAdmin, getUser } from "@/lib/session";
import { hasAccess } from "@/lib/access";
import { qrSvg } from "@/lib/upi";
import { absUrl } from "@/lib/site";
import { dayLabel } from "@/lib/event-format";
import { cityName } from "@/lib/cities";
import { TicketQr } from "@/components/TicketQr";
import { PartyBackground } from "@/components/fx/Backgrounds";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your pass", robots: { index: false } };

/** One friend's pass inside a group ticket. Shows their QR only — not the booker's details. */
export default async function GuestPass({ params, searchParams }: { params: Promise<{ code: string; n: string }>; searchParams: Promise<{ k?: string }> }) {
  const [{ code: raw, n: nRaw }, { k }] = await Promise.all([params, searchParams]);
  const code = raw.toUpperCase();
  const n = Number(nRaw);
  const o = await getOrder(code);
  if (!o || !Number.isInteger(n) || n < 1 || n > o.admits) notFound();
  const [user, admin] = await Promise.all([getUser(), getAdmin()]);
  const allowed = Boolean(admin) || (user && o.userId === user.id) || hasAccess("guest", `${code}:${n}`, k);
  if (!allowed)
    return (
      <div className="px-6 pt-16 text-center">
        <Lock className="mx-auto size-8 text-faint" />
        <p className="mt-3 text-[15px] font-semibold">This pass link is private</p>
        <p className="mt-1 text-[13px] text-muted">Ask whoever booked to send you your pass again.</p>
      </div>
    );

  const confirmed = o.status === "confirmed" || o.status === "checked_in";
  const admitted = Array.isArray(o.admitted) ? o.admitted : [];
  const used = admitted.includes(n);
  const svg = confirmed && !used ? await qrSvg(absUrl(`/door?code=${o.code}&g=${n}`)) : null;
  return (
    <>
      <PartyBackground />
      <div className="mx-auto max-w-[460px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-gold">Guest {n} of {o.admits}</p>
        <h1 className="mt-1.5 font-display text-[28px] font-extrabold leading-tight">{o.eventTitle}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-muted"><CalendarDays className="size-4" /> {o.day ? dayLabel(o.day) : ""} · {o.tierName}</p>
        <p className="mt-1 flex items-center gap-1.5 text-[13.5px] text-muted"><MapPin className="size-4" /> {o.venueName}, {cityName(o.citySlug)}</p>
        <div className="mt-5 rounded-[22px] border border-line bg-surface p-4">
          <p className="font-display text-[22px] font-extrabold tracking-[0.12em]">{o.code}·{n}</p>
          {used ? (
            <p className="mt-3 flex items-center gap-2 text-[14px] font-semibold text-gold"><Check className="size-4" /> Already checked in — enjoy the night</p>
          ) : svg ? (
            <TicketQr svg={svg} caption="Show this at the entry with a photo ID. It works once, for one person, and opens offline once you've viewed it." />
          ) : (
            <p className="mt-3 text-[13.5px] text-muted">Your pass appears here once the booking is confirmed.</p>
          )}
        </div>
      </div>
    </>
  );
}

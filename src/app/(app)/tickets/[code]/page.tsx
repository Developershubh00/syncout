import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, CalendarDays, Check, Hourglass, XCircle, Lock } from "lucide-react";
import { getOrder } from "@/lib/tevents";
import { getAdmin, getUser } from "@/lib/session";
import { hasAccess } from "@/lib/access";
import { getSettings } from "@/lib/settings";
import { upiLink, qrSvg, looksLikeVpa } from "@/lib/upi";
import { dayLabel, timeLabel, rs } from "@/lib/event-format";
import { ORDER_STATUS } from "@/lib/event-labels";
import { cityName } from "@/lib/cities";
import { PaymentPanel } from "@/components/events/PaymentPanel";
import { PartyBackground } from "@/components/fx/Backgrounds";
import { TicketQr } from "@/components/TicketQr";
import { SplitPasses } from "@/components/SplitPasses";
import { AddToCalendar } from "@/components/AddToCalendar";
import { ShareButton } from "@/components/ShareButton";
import { absUrl } from "@/lib/site";
import { istAt } from "@/lib/guestlist";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your booking", robots: { index: false, follow: false } };

export default async function TicketPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ k?: string }> }) {
  const [{ code: raw }, { k }] = await Promise.all([params, searchParams]);
  const code = raw.toUpperCase();
  const o = await getOrder(code);
  if (!o) notFound();

  const [user, admin, settings] = await Promise.all([getUser(), getAdmin(), getSettings()]);
  const allowed = Boolean(admin) || (user && o.userId === user.id) || hasAccess("ticket", code, k);
  const day = o.day ? dayLabel(o.day) : "";
  const city = cityName(o.citySlug);

  if (!allowed) {
    return (
      <>
        <PartyBackground />
        <Header />
        <div className="mx-4 rounded-[22px] border border-line bg-surface p-5 lg:mx-0">
          <p className="flex items-center gap-2 text-[14px] font-semibold"><Lock className="size-4 text-faint" /> This booking is private</p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">
            Open it from the link in your email or WhatsApp, or log in with the account you booked with.
          </p>
          <Link href={`/events/${o.eventSlug}`} className="mt-4 flex h-11 items-center justify-center rounded-xl bg-raised text-[13.5px] font-semibold">
            View {o.eventTitle}
          </Link>
        </div>
      </>
    );
  }

  const confirmed = o.status === "confirmed" || o.status === "checked_in";
  const payable = o.status === "awaiting_payment" || o.status === "payment_submitted";
  const look = ORDER_STATUS[o.status];
  const doorQr = confirmed ? await qrSvg(absUrl(`/door?code=${o.code}`)) : null;
  const admitted = Array.isArray(o.admitted) ? o.admitted : [];
  const startAt = (() => {
    const base = new Date(o.startsAt);
    const ist = new Date(base.getTime() + 330 * 60000);
    return o.day ? istAt(o.day, ist.getUTCHours(), ist.getUTCMinutes()) : base;
  })();
  const Icon = confirmed ? Check : o.status === "rejected" || o.status === "cancelled" ? XCircle : Hourglass;

  let upi: { vpa: string | null; payee: string; link: string | null; qrSvg: string | null; qrImage: string | null } | null = null;
  if (payable && o.mode === "upi" && o.amount > 0) {
    if (looksLikeVpa(settings.upiVpa)) {
      const link = upiLink({ vpa: settings.upiVpa, name: settings.payeeName, amount: o.amount, note: `SyncOut ${o.code}` });
      upi = { vpa: settings.upiVpa, payee: settings.payeeName, link, qrSvg: await qrSvg(link), qrImage: null };
    } else if (settings.upiQrImage) {
      upi = { vpa: null, payee: settings.payeeName, link: null, qrSvg: null, qrImage: settings.upiQrImage };
    }
  }

  return (
    <>
      <PartyBackground />
      <Header />
      <div className="mx-auto max-w-[560px] px-4 lg:px-0">
        <div className={`overflow-hidden rounded-[22px] border bg-surface ${confirmed ? "border-gold/45" : "border-line"}`}>
          <div className="flex gap-3.5 p-4">
            <div className="relative size-[84px] shrink-0 overflow-hidden rounded-xl bg-raised">
              {o.poster && <Image src={o.poster} alt="" fill sizes="90px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${look.cls}`}>
                <Icon className="size-3" /> {o.mode === "free" && o.status === "payment_submitted" ? "Waiting for confirmation" : look.label}
              </span>
              <h1 className="mt-1.5 line-clamp-2 font-display text-[19px] font-extrabold leading-tight">{o.eventTitle}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted"><MapPin className="size-3.5" /> {o.venueName} · {city}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted"><CalendarDays className="size-3.5" /> {day} · {timeLabel(o)}</p>
            </div>
          </div>

          <div className="stub-notch h-6">
            <div className="dashed-tear mx-[26px] translate-y-3" />
          </div>

          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-3">
              <Cell k="Name" v={o.name} />
              <Cell k="Tickets" v={`${o.quantity} × ${o.tierName}`} />
              <Cell k="Total" v={rs(o.amount)} />
            </div>
            <div className={`mt-4 rounded-2xl border px-4 py-3.5 text-center ${confirmed ? "border-gold/40 bg-gold/[0.07]" : "border-line bg-raised"}`}>
              <p className="text-[11.5px] text-muted">{confirmed ? "Show this at the entry" : "Booking code"}</p>
              <p className={`mt-1 font-display text-[32px] font-extrabold leading-none tracking-[0.14em] ${confirmed ? "text-gold" : "text-text"}`}>{o.code}</p>
              {confirmed && <p className="mt-2 text-[11.5px] text-muted">Admits {o.admits}</p>}
            </div>
            {doorQr && <TicketQr svg={doorQr} caption={o.admits > 1 ? `Lets in all ${o.admits} at once — or send each friend their own pass below.` : "Brightness up, and show this with a photo ID. It opens offline once you've viewed it here."} />}
            {o.discount > 0 && <p className="mt-3 text-[12.5px] font-semibold text-gold">Code {o.promoCode} saved you {rs(o.discount)}</p>}
          </div>
        </div>

        {confirmed && (
          <div className="mt-4 space-y-2.5">
            <SplitPasses code={o.code} admits={o.admits} admitted={admitted} title={o.eventTitle} when={o.day ? dayLabel(o.day) : ""} />
            <AddToCalendar
              title={o.eventTitle}
              start={startAt}
              end={new Date(startAt.getTime() + 5 * 3600e3)}
              location={`${o.venueName}, ${city}`}
              details={`Booking ${o.code} · ${o.quantity} × ${o.tierName}`}
              icsHref={`/api/calendar/${o.code}${k ? `?k=${k}` : ""}`}
            />
            <ShareButton path={`/events/${o.eventSlug}`} title={o.eventTitle} text={`I'm going to ${o.eventTitle} — come along!`} label="Invite friends" className="h-11 w-full justify-center rounded-xl" />
          </div>
        )}

        {payable && (
          <div className="mt-4">
            <PaymentPanel
              code={o.code}
              k={k ?? null}
              status={o.status}
              mode={o.mode}
              amount={o.amount}
              whatsapp={settings.whatsapp}
              holdHours={settings.orderHoldHours}
              upi={upi}
              order={{ eventTitle: o.eventTitle, venue: o.venueName, dayLabel: day, tierName: o.tierName, quantity: o.quantity, name: o.name, phone: o.phone }}
            />
          </div>
        )}

        {o.status === "rejected" && (
          <p className="mt-4 rounded-[18px] border border-red/30 bg-red/[0.06] p-4 text-[13px] leading-relaxed text-muted">
            We couldn&apos;t confirm this booking. If you&apos;ve paid, message us on WhatsApp with the screenshot and code {o.code}.
          </p>
        )}

        <p className="mt-5 text-center text-[12px] text-faint">
          Carry a government photo ID. {o.ageLimit ? `Age ${o.ageLimit}. ` : ""}Entry is at the organiser&apos;s discretion.
        </p>
      </div>
      <div className="h-10" />
    </>
  );
}

function Header() {
  return (
    <header className="flex items-center gap-2 px-4 py-3.5 lg:px-0">
      <Link href="/passes" aria-label="Back to passes" className="-ml-1.5 rounded-full p-1.5 active:bg-raised">
        <ChevronLeft className="size-5" />
      </Link>
      <h1 className="text-[17px]">Your booking</h1>
    </header>
  );
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-faint">{k}</p>
      <p className="truncate text-[13.5px] font-medium">{v}</p>
    </div>
  );
}

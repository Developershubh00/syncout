import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MapPin, Clock, CalendarDays, Check, Info, Shirt, Users } from "lucide-react";
import { cachedEvent } from "@/lib/cache";
import { tierSold, eventDays, goingCount } from "@/lib/tevents";
import { ShareButton } from "@/components/ShareButton";
import { BadgeCheck, MessageCircle, QrCode, Users as UsersIcon, BadgePercent, Timer } from "lucide-react";
import { CountdownChip } from "@/components/events/Countdown";
import { getSettings } from "@/lib/settings";
import { getUser } from "@/lib/session";
import { looksLikeVpa } from "@/lib/upi";
import { datesLabel, timeLabel, rs } from "@/lib/event-format";
import { categoryLabel } from "@/lib/event-labels";
import { cityName } from "@/lib/cities";
import { absUrl, SITE } from "@/lib/site";
import { TicketFlow, type FlowTier } from "@/components/events/TicketFlow";
import { PartyBackground } from "@/components/fx/Backgrounds";
import { JsonLd } from "@/components/JsonLd";
import { ParallaxHero } from "@/components/motion/ParallaxHero";
import { Reveal } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const ev = await cachedEvent((await params).slug);
  if (!ev) return { title: "Event" };
  const city = cityName(ev.citySlug);
  const from = ev.tiers.filter((t) => t.isActive).map((t) => t.price);
  const title = `${ev.title} — ${categoryLabel(ev.category)} in ${city}, ${datesLabel(ev)}`;
  const description = `${ev.title} at ${ev.venueName}, ${city}. ${datesLabel(ev)} · ${timeLabel(ev)}.${
    from.length ? ` Passes from ${rs(Math.min(...from))}.` : ""
  } Book on SyncOut — pay by UPI, confirmed on WhatsApp.`;
  return {
    title,
    description,
    alternates: { canonical: `/events/${ev.slug}` },
    openGraph: { title, description, type: "website", url: absUrl(`/events/${ev.slug}`) },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Event, settings and session in parallel — one round trip instead of three.
  const [ev, settings, user] = await Promise.all([cachedEvent(slug), getSettings(), getUser()]);
  if (!ev) notFound();

  const [sold, going] = await Promise.all([tierSold(ev.id, settings.orderHoldHours), goingCount(ev.id)]);
  const days = eventDays(ev);
  const tiers = ev.tiers.filter((t) => t.isActive);
  const city = cityName(ev.citySlug);
  const end = ev.endsAt ?? new Date(new Date(ev.startsAt).getTime() + 6 * 3600e3);
  const over = Date.now() > new Date(end).getTime();
  const nowMs = Date.now();
  const onSale = tiers.filter((t) => (!t.salesStartAt || new Date(t.salesStartAt).getTime() <= nowMs) && (!t.salesEndAt || new Date(t.salesEndAt).getTime() > nowMs));
  const from = onSale.length ? Math.min(...onSale.map((t) => t.price)) : tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
  const earlyBird = onSale.filter((t) => t.salesEndAt).sort((a, b) => new Date(a.salesEndAt!).getTime() - new Date(b.salesEndAt!).getTime())[0];

  // Tickets left per tier per day (capacity is "per day").
  const flowTiers: FlowTier[] = tiers.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: t.price,
    admits: t.admits,
    perOrderMax: t.perOrderMax,
    left: t.capacity == null ? null : Object.fromEntries(days.map((d) => [d, Math.max(0, t.capacity! - (sold[`${t.id}|${d}`] ?? 0))])),
    compareAtPrice: t.compareAtPrice,
    badge: t.badge,
    salesStartAt: t.salesStartAt ? new Date(t.salesStartAt).toISOString() : null,
    salesEndAt: t.salesEndAt ? new Date(t.salesEndAt).toISOString() : null,
  }));

  const mapHref = ev.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(`${ev.venueName} ${ev.address ?? ev.area ?? ""} ${city}`)}`;

  return (
    <>
      <PartyBackground />
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Event",
            name: ev.title,
            description: ev.description ?? undefined,
            image: [ev.poster ? (ev.poster.startsWith("http") ? ev.poster : absUrl(ev.poster)) : absUrl("/opengraph-image")],
            startDate: ev.timeLabel ? days[0] : new Date(ev.startsAt).toISOString(),
            endDate: new Date(end).toISOString(),
            eventStatus: "https://schema.org/EventScheduled",
            eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
            location: {
              "@type": "Place",
              name: ev.venueName,
              address: {
                "@type": "PostalAddress",
                streetAddress: ev.address ?? ev.area ?? ev.venueName,
                addressLocality: city,
                addressRegion: ev.citySlug === "gurugram" ? "Haryana" : ev.citySlug === "noida" ? "Uttar Pradesh" : "Delhi",
                addressCountry: "IN",
              },
            },
            organizer: { "@type": "Organization", name: ev.organizer || SITE.name, url: SITE.url },
            ...(tiers.length
              ? {
                  offers: tiers.map((t) => ({
                    "@type": "Offer",
                    name: t.name,
                    price: t.price,
                    priceCurrency: "INR",
                    availability: ev.salesOpen && !over ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
                    url: absUrl(`/events/${ev.slug}`),
                    validFrom: new Date(ev.createdAt).toISOString(),
                  })),
                }
              : {}),
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Events", item: absUrl("/events") },
              { "@type": "ListItem", position: 2, name: `Events in ${city}`, item: absUrl(`/events/in/${ev.citySlug}`) },
              { "@type": "ListItem", position: 3, name: ev.title, item: absUrl(`/events/${ev.slug}`) },
            ],
          },
        ]}
      />

      <div className="lg:grid lg:grid-cols-[1.15fr_1fr] lg:gap-10">
        <ParallaxHero
          className="relative aspect-[4/3] w-full overflow-hidden lg:aspect-[16/11] lg:rounded-[26px]"
          image={
            <>
              {ev.poster && <Image src={ev.poster} alt={`${ev.title} poster`} fill priority sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />}
              <div className="scrim absolute inset-x-0 bottom-0 h-3/4" />
            </>
          }
          overlay={
            <>
          <Link href="/events" aria-label="Back to events" className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-ink/65 backdrop-blur">
            <ChevronLeft className="size-5" />
          </Link>
          <span className="absolute right-3 top-3 rounded-lg bg-gradient-to-r from-[#ff2bd6] to-[#ff8a00] px-2.5 py-1 text-[12px] font-bold text-white">
            {categoryLabel(ev.category)}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-4 lg:p-6">
            <h1 className="font-display text-[27px] font-extrabold leading-[1.08] tracking-tight lg:text-[36px]">{ev.title}</h1>
            <a href={mapHref} target="_blank" rel="noreferrer" className="mt-1.5 flex items-center gap-1.5 text-[13px] text-white/80">
              <MapPin className="size-3.5" />
              {ev.venueName}
              {ev.area ? ` · ${ev.area}` : ""} · {city}
            </a>
          </div>
            </>
          }
        />

        <div className="lg:pt-2">
          <div className="flex flex-wrap gap-2 px-4 pt-4 lg:px-0 lg:pt-0">
            <Chip icon={<CalendarDays className="size-3.5" />}>{datesLabel(ev)}</Chip>
            <Chip icon={<Clock className="size-3.5" />}>{timeLabel(ev)}</Chip>
            {from !== null && <Chip gold>{from ? `from ${rs(from)}` : "Free"}</Chip>}
            <ShareButton path={`/events/${ev.slug}`} title={ev.title} text={`${ev.title} at ${ev.venueName}, ${datesLabel(ev)} — let's go!`} className="ml-auto" />
          </div>

          {earlyBird?.salesEndAt && (
            <CountdownChip
              until={new Date(earlyBird.salesEndAt).toISOString()}
              prefix={`${earlyBird.badge || earlyBird.name} · ${rs(earlyBird.price)} ends in`}
              icon={<Timer className="size-3.5" />}
              className="mx-4 mt-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[12.5px] font-semibold text-gold lg:mx-0"
            />
          )}

          {going >= 10 && (
            <p className="mx-4 mt-3 inline-flex items-center gap-2 rounded-full border border-[#ff2bd6]/30 bg-[#ff2bd6]/10 px-3 py-1.5 text-[12.5px] font-semibold lg:mx-0">
              <UsersIcon className="size-3.5 text-[#ff6ad5]" /> {going}+ people going through SyncOut
            </p>
          )}

          {ev.highlights.length > 0 && (
            <Reveal y={16}>
            <ul className="flex flex-wrap gap-2 px-4 pt-4 lg:px-0">
              {ev.highlights.map((h) => (
                <li key={h} className="flex items-center gap-1.5 rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1 text-[12.5px]">
                  <Check className="size-3.5 text-gold" /> {h}
                </li>
              ))}
            </ul>
            </Reveal>
          )}

          {ev.description && <p className="px-4 pt-4 text-[14px] leading-relaxed text-white/80 lg:px-0">{ev.description}</p>}

          <dl className="mx-4 mt-5 grid grid-cols-2 gap-2.5 lg:mx-0">
            {ev.ageLimit && <Fact icon={<Users className="size-4" />} k="Age" v={ev.ageLimit} />}
            {ev.dressCode && <Fact icon={<Shirt className="size-4" />} k="Dress" v={ev.dressCode} />}
            {ev.organizer && <Fact icon={<Info className="size-4" />} k="By" v={ev.organizer} />}
            <Fact icon={<MapPin className="size-4" />} k="Where" v={ev.address ?? `${ev.venueName}, ${city}`} />
          </dl>

          <TicketFlow
            event={{
              id: ev.id,
              title: ev.title,
              venueName: ev.venueName,
              days,
              bookingMode: ev.bookingMode,
              externalUrl: ev.externalUrl,
              open: ev.salesOpen && !over,
              closedReason: over ? "This event is over — see what's coming up next." : "Bookings for this event are closed.",
              upiReady: looksLikeVpa(settings.upiVpa) || Boolean(settings.upiQrImage),
            }}
            tiers={flowTiers}
            user={user ? { name: user.name, email: user.email } : null}
          />

          <ul className="mx-4 mt-4 grid grid-cols-2 gap-2 text-[12px] lg:mx-0">
            {[
              { Icon: BadgeCheck, t: "Pay by UPI, any app" },
              { Icon: MessageCircle, t: "Confirmed on WhatsApp" },
              { Icon: QrCode, t: "QR ticket, works offline" },
              settings.noBookingFee ? { Icon: BadgePercent, t: "No booking fee" } : { Icon: MessageCircle, t: "Real people on WhatsApp" },
            ].map(({ Icon, t }) => (
              <li key={t} className="flex items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2 text-muted">
                <Icon className="size-4 shrink-0 text-gold" /> {t}
              </li>
            ))}
          </ul>

          {ev.terms && (
            <details className="mx-4 mt-5 rounded-[18px] border border-line bg-surface/80 p-4 lg:mx-0">
              <summary className="cursor-pointer list-none text-[13px] font-semibold">Terms & entry rules</summary>
              <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-muted">{ev.terms}</p>
            </details>
          )}
        </div>
      </div>
      <div className="h-8" />
    </>
  );
}

function Chip({ icon, children, gold }: { icon?: React.ReactNode; children: React.ReactNode; gold?: boolean }) {
  return (
    <span className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] " + (gold ? "border-gold/40 text-gold" : "border-line bg-ink/40 text-muted")}>
      {icon}
      {children}
    </span>
  );
}

function Fact({ icon, k, v }: { icon: React.ReactNode; k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface/80 p-3">
      <dt className="flex items-center gap-1.5 text-[11.5px] text-faint">{icon} {k}</dt>
      <dd className="mt-1 text-[13px] leading-snug">{v}</dd>
    </div>
  );
}

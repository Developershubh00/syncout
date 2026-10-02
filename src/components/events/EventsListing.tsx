import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { cachedEvents } from "@/lib/cache";
import { EventCard, toCard } from "./EventCard";
import { Empty } from "@/components/Empty";
import { PartyBackground } from "@/components/fx/Backgrounds";
import { MotionCard } from "@/components/motion/Reveal";
import { JsonLd } from "@/components/JsonLd";
import { DevDbHint } from "@/components/DevDbHint";
import { LIVE_CITIES, cityName } from "@/lib/cities";
import { CATEGORIES, categoryLabel } from "@/lib/event-labels";
import { absUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Props = {
  heading: string;
  intro: string;
  city?: string;
  category?: string;
  /** Builds chip links; landing pages keep their own URL shape. */
  basePath: "/events" | "/dandiya";
  faq?: { q: string; a: string }[];
};

/** Shared by /events, /events/in/[city], /dandiya and /dandiya/[city]. */
export async function EventsListing({ heading, intro, city, category, basePath, faq }: Props) {
  const list = await cachedEvents({ citySlug: city, category: basePath === "/dandiya" ? undefined : category, limit: 90 });
  const events = basePath === "/dandiya" ? list.filter((e) => e.category === "dandiya" || e.category === "garba") : list;
  const present = new Set(list.map((e) => e.category));

  const cityHref = (slug?: string) =>
    basePath === "/dandiya"
      ? slug ? `/dandiya/${slug}` : "/dandiya"
      : slug ? `/events/in/${slug}${category ? `?category=${category}` : ""}` : `/events${category ? `?category=${category}` : ""}`;
  const catHref = (id?: string) => {
    const root = city ? `/events/in/${city}` : "/events";
    return id ? `${root}?category=${id}` : root;
  };

  return (
    <>
      <PartyBackground />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: heading,
          itemListElement: events.slice(0, 30).map((e, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(`/events/${e.slug}`), name: e.title })),
        }}
      />
      {faq && faq.length > 0 && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          }}
        />
      )}

      <header className="px-4 pb-2 pt-6 lg:px-0">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11.5px] font-semibold text-gold">
          <CalendarHeart className="size-3.5" /> Navratri 11–19 Oct · Dussehra 20 Oct
        </p>
        <h1 className="mt-3 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight lg:text-[42px]">
          <span className="text-shimmer">{heading}</span>
        </h1>
        <p className="mt-2 max-w-[60ch] text-[13.5px] leading-relaxed text-muted">{intro}</p>
      </header>

      <nav aria-label="Cities" className="rail chips py-3">
        {[{ slug: undefined, short: "All NCR" }, ...LIVE_CITIES].map((c) => (
          <Link
            key={c.short}
            href={cityHref(c.slug)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium",
              c.slug === city ? "chip-on border-[#ff2bd6] bg-[#ff2bd6]/15 text-text" : "border-line bg-ink/40 text-muted transition-colors hover:text-text"
            )}
          >
            {c.short}
          </Link>
        ))}
      </nav>

      {basePath === "/events" && present.size > 1 && (
        <nav aria-label="Categories" className="rail chips pb-2">
          {[{ id: undefined, label: "Everything" }, ...CATEGORIES.filter((c) => present.has(c.id))].map((c) => (
            <Link
              key={c.label}
              href={catHref(c.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-[12.5px]",
                c.id === category ? "border-gold/60 bg-gold/10 text-gold" : "border-line text-faint"
              )}
            >
              {c.label}
            </Link>
          ))}
        </nav>
      )}

      {events.length === 0 ? (
        <div className="pt-4">
          <Empty
            title={`Nothing listed${city ? ` in ${cityName(city)}` : ""} yet`}
            body="New events go up every week. Try another city or check back soon."
            cta={city || category ? { href: basePath, label: "See all of Delhi NCR" } : undefined}
          />
          <DevDbHint />
        </div>
      ) : (
        <div className="mt-3 grid gap-x-5 gap-y-7 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
          {events.map((e, i) => (
            <MotionCard key={e.id} index={i} columns={3}>
              <EventCard ev={toCard(e)} wide priority={i < 2} />
            </MotionCard>
          ))}
        </div>
      )}

      {faq && faq.length > 0 && (
        <section className="mt-12 px-4 lg:px-0">
          <h2 className="text-[17px]">Good to know</h2>
          <div className="mt-3 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface/80">
            {faq.map((f) => (
              <details key={f.q} className="group px-4 py-3.5">
                <summary className="cursor-pointer list-none text-[14px] font-semibold">{f.q}</summary>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}
      <div className="h-10" />
    </>
  );
}

export function dandiyaFaq(city?: string) {
  const where = city ? cityName(city) : "Delhi NCR";
  return [
    { q: `When is Navratri 2026?`, a: "Sharad Navratri runs from Sunday 11 October to Monday 19 October 2026, with Dussehra on Tuesday 20 October. Most Dandiya nights fall on the weekend of 16–18 October." },
    { q: `How do I book Dandiya passes in ${where} on SyncOut?`, a: "Pick an event, choose your passes and date, and pay by UPI QR. Send the payment screenshot on WhatsApp and your passes are confirmed on the site, by email and on WhatsApp." },
    { q: "Do I need to carry anything?", a: "Carry a government photo ID and your booking code. Some venues have age limits or dress codes — they're listed on each event." },
    { q: "Can I get a refund?", a: "Refunds follow each organiser's policy. Message us on WhatsApp with your booking code and we'll help." },
  ];
}

export { categoryLabel };

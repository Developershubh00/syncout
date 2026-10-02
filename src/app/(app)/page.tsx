import { Suspense } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { AppHeader } from "@/components/AppHeader";
import { getUser } from "@/lib/session";
import { CityRemember } from "@/components/CityRemember";
import { preferredCity } from "@/lib/city-pref";
import { CutoffBanner } from "@/components/CutoffBanner";
import { SectionHead } from "@/components/SectionHead";
import { ClubCard, NightCard, OfferCard } from "@/components/Cards";
import { EventCard, toCard } from "@/components/events/EventCard";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { cachedClubs, cachedNights, cachedOffers, cachedEvents } from "@/lib/cache";
import { getSettings, type HomeSection } from "@/lib/settings";
import { Empty } from "@/components/Empty";
import { DesktopHero } from "@/components/DesktopHero";
import { Reveal, MotionCard } from "@/components/motion/Reveal";
import { Marquee } from "@/components/motion/Marquee";
import { JsonLd } from "@/components/JsonLd";
import { SITE, absUrl } from "@/lib/site";
import { DEFAULT_CITY, isLiveCity } from "@/lib/cities";
import { Logo } from "@/components/brand/Logo";

export default async function Home({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const { city: raw } = await searchParams;
  const user = await getUser();
  const initials = user?.name?.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") ?? "";
  const { city, explicit } = await preferredCity(raw);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: SITE.name,
            url: SITE.url,
            logo: absUrl("/icons/icon-512.png"),
            description: SITE.description,
            areaServed: ["New Delhi", "Gurugram", "Noida"],
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: SITE.name,
            url: SITE.url,
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: absUrl("/search?q={search_term_string}") },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      {explicit && <CityRemember city={city} />}
      <AppHeader city={city} name={user?.name} initials={initials} />
      <div className="hidden lg:block">
        <TopBar city={city} />
      </div>
      <CutoffBanner />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeBody city={city} />
      </Suspense>
      <Footer />
    </>
  );
}

async function HomeBody({ city }: { city: string }) {
  const [nights, clubs, offers, events, settings, noidaClubs] = await Promise.all([
    cachedNights({ citySlug: city, limit: 12 }),
    cachedClubs(city, 14),
    cachedOffers(),
    cachedEvents({ limit: 24 }),
    getSettings(),
    cachedClubs("noida", 60),
  ]);

  const featured = clubs.filter((c) => c.isFeatured);
  const rest = clubs.filter((c) => !c.isFeatured);
  // This city's events first, then the rest of NCR.
  const eventList = [...events.filter((e) => e.citySlug === city), ...events.filter((e) => e.citySlug !== city)].slice(0, 12);
  const lead = nights[0];

  const sections: Record<HomeSection["key"], (s: HomeSection) => React.ReactNode> = {
    events: (s) =>
      eventList.length > 0 && (
        <section className="festive-panel mx-4 mt-8 rounded-[24px] border border-[#ff2bd6]/20 py-5 lg:mx-0 lg:px-6">
          <SectionHead title={s.title} sub={s.sub || undefined} href="/events" />
          <div className="rail">
            {eventList.map((e, i) => (
              <MotionCard key={e.id} index={i} columns={3}>
                <EventCard ev={toCard(e)} />
              </MotionCard>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2 px-4 lg:px-0">
            {[
              ["Delhi", "/dandiya/new-delhi"],
              ["Gurugram", "/dandiya/gurugram"],
              ["Noida", "/dandiya/noida"],
            ].map(([label, href]) => (
              <Link key={href} href={href} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold">
                Dandiya in {label}
              </Link>
            ))}
          </div>
        </section>
      ),
    aroundTown: (s) => (
      <section className="pt-8 lg:pt-10">
        <SectionHead title={s.title} sub={s.sub || (nights.length ? `${nights.length} nights coming up` : undefined)} href="/nights" />
        {nights.length ? (
          <div className="rail">
            {nights.map((n, i) => (
              <MotionCard key={n.id} index={i} columns={3}>
              <NightCard
                ev={{
                  slug: n.slug,
                  title: n.title,
                  poster: n.poster,
                  startsAt: n.startsAt,
                  artist: n.artist,
                  musicType: n.musicType,
                  clubName: n.clubName,
                  clubArea: n.clubArea,
                  femalePrice: n.femalePrice,
                }}
              />
              </MotionCard>
            ))}
          </div>
        ) : (
          <Empty
            title="No nights listed here yet"
            body="We add the week's line-up every Monday. Pick another city, or browse the clubs."
            cta={{ href: "/clubs", label: "Browse clubs" }}
          />
        )}
      </section>
    ),
    hotspots: (s) =>
      featured.length > 0 && (
        <section className="pt-9">
          <SectionHead title={s.title} sub={s.sub || undefined} href="/clubs" />
          <div className="rail rail-4">
            {featured.map((c, i) => (
              <MotionCard key={c.id} index={i} columns={4}>
                <ClubCard club={c} />
              </MotionCard>
            ))}
          </div>
        </section>
      ),
    onTheHouse: (s) =>
      offers.length > 0 && (
        <section className="pt-9">
          <SectionHead title={s.title} sub={s.sub || undefined} />
          <div className="rail">
            {offers.map((o, i) => (
              <MotionCard key={o.id} index={i} columns={3}>
                <OfferCard offer={o} />
              </MotionCard>
            ))}
          </div>
        </section>
      ),
    howItWorks: (s) => <HowItWorks title={s.title} />,
    moreClubs: (s) =>
      rest.length > 0 && (
        <section className="pt-9">
          <SectionHead title={s.title} sub={s.sub || undefined} href="/clubs" />
          {/* 2 across on phones, 4 across on desktop — small cards, not posters */}
          <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 lg:px-0">
            {rest.slice(0, 8).map((c, i) => (
              <MotionCard key={c.id} index={i} columns={4}>
                <ClubCard club={c} width="w-full" />
              </MotionCard>
            ))}
          </div>
        </section>
      ),
  };

  return (
    <>
      <DesktopHero
        nightCount={nights.length}
        featured={
          lead
            ? {
                slug: lead.slug,
                title: lead.title,
                poster: lead.poster,
                startsAt: lead.startsAt,
                musicType: lead.musicType,
                clubName: lead.clubName,
                clubArea: lead.clubArea,
              }
            : null
        }
      />
      <Marquee items={clubs.map((c) => c.name)} label="Clubs you can get on the list for" />
      {noidaClubs.some((c) => c.inHouse) && (
        <Reveal>
          <section className="pt-7">
            <SectionHead title="SyncOut House" sub="Our own clubs at Gardens Galleria — premium crowd, food & drinks" href="/clubs/in/noida" />
            <div className="rail">
              {noidaClubs.filter((c) => c.inHouse).map((c, i) => (
                <MotionCard key={c.id} index={i} columns={4}>
                  <ClubCard club={c} width="w-[176px]" />
                </MotionCard>
              ))}
            </div>
          </section>
        </Reveal>
      )}
      {settings.homeSections
        .filter((s) => s.visible)
        .map((s, i) => {
          const node = sections[s.key]?.(s);
          return node ? (
            <Reveal key={s.key} delay={i === 0 ? 0 : 0.04}>
              {node}
            </Reveal>
          ) : null;
        })}
      <SeoBlurb />
    </>
  );
}

function HowItWorks({ title }: { title: string }) {
  const steps = [
    { t: "Pick your night", d: "Choose a club and a date, or a Dandiya event. Applications open a week ahead." },
    { t: "Tell us who's coming", d: "Girls, couples or guys for clubs — or pick your passes for an event." },
    { t: "Get approved", d: "Guestlists confirm by 6 PM. Event passes confirm as soon as payment is checked." },
  ];
  return (
    <section className="px-4 pt-10 lg:px-0">
      <h2 className="text-[19px]">{title}</h2>
      <ol className="mt-4 space-y-0">
        {steps.map((s, i) => (
          <li key={s.t} className="flex gap-3.5 pb-5 last:pb-0">
            <div className="flex flex-col items-center">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-red/40 bg-red/12 font-display text-[12.5px] font-bold text-red-hot">
                {i + 1}
              </span>
              {i < steps.length - 1 && <span className="mt-1 w-px flex-1 bg-line" />}
            </div>
            <div className="-mt-0.5">
              <p className="text-[14.5px] font-semibold">{s.t}</p>
              <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Plain words for search engines and people alike — kept short and at the bottom. */
function SeoBlurb() {
  return (
    <section className="px-4 pt-12 lg:px-0">
      <h2 className="text-[15px] text-muted">Nightlife in Delhi NCR, sorted</h2>
      <p className="mt-2 max-w-[80ch] text-[12.5px] leading-relaxed text-faint">
        SyncOut gets you on the guestlist at the best clubs in{" "}
        <Link href="/clubs/in/new-delhi" className="underline-offset-2 hover:underline">Delhi</Link>,{" "}
        <Link href="/clubs/in/gurugram" className="underline-offset-2 hover:underline">Gurugram</Link> and{" "}
        <Link href="/clubs/in/noida" className="underline-offset-2 hover:underline">Noida</Link> — free entry for approved
        lists, with food and drinks on many nights. This Navratri, book passes for{" "}
        <Link href="/dandiya" className="underline-offset-2 hover:underline">Dandiya and Garba nights across Delhi NCR</Link>,
        pay by UPI and get confirmed on WhatsApp.
      </p>
    </section>
  );
}

function HomeSkeleton() {
  return (
    <div className="pt-8">
      <div className="rail">
        {[0, 1, 2].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="cv-auto mt-14 border-t border-line px-4 py-8 text-[12.5px] text-faint lg:hidden">
      <Logo size="xs" hello={false} />
      <p className="mt-2 max-w-[42ch] leading-relaxed">
        Guestlists and Dandiya events for Delhi NCR. 21+ with a government photo ID for clubs. Entry stays at the venue&apos;s
        discretion and guestlists close at 6 PM on the day.
      </p>
      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/events">Events</Link>
        <Link href="/dandiya">Dandiya 2026</Link>
        <Link href="/clubs">Clubs</Link>
        <Link href="/nights">Nights</Link>
        <Link href="/passes">Your passes</Link>
        <Link href="/careers">Careers</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refunds</Link>
      </nav>
      <p className="mt-5 text-faint">© {new Date().getFullYear()} SyncOut Pvt Ltd</p>
    </footer>
  );
}

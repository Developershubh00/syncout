import { Suspense } from "react";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { CutoffBanner } from "@/components/CutoffBanner";
import { SectionHead } from "@/components/SectionHead";
import { ClubCard, NightCard, OfferCard } from "@/components/Cards";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { getClubs, getNights, getOffers } from "@/lib/queries";
import { Empty } from "@/components/Empty";
import { DesktopHero } from "@/components/DesktopHero";

export const revalidate = 120;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "new-delhi" } = await searchParams;

  return (
    <>
      <TopBar city={city} />
      <CutoffBanner />
      <Suspense fallback={<HomeSkeleton />}>
        <HomeBody city={city} />
      </Suspense>
      <Footer />
    </>
  );
}

async function HomeBody({ city }: { city: string }) {
  const [nights, clubs, offers] = await Promise.all([
    getNights({ citySlug: city, limit: 12 }),
    getClubs(city, 14),
    getOffers(),
  ]);

  const featured = clubs.filter((c) => c.isFeatured);
  const rest = clubs.filter((c) => !c.isFeatured);

  const lead = nights[0];

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

      <section className="pt-8 lg:pt-0">
        <SectionHead
          title="Around town"
          sub={nights.length ? `${nights.length} nights taking applications` : undefined}
          href="/nights"
        />
        {nights.length ? (
          <div className="rail">
            {nights.map((n) => (
              <NightCard
                key={n.id}
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

      {featured.length > 0 && (
        <section className="pt-9">
          <SectionHead title="Hotspots" sub="Where the city actually goes" href="/clubs" />
          <div className="rail">
            {featured.map((c) => (
              <ClubCard key={c.id} club={c} />
            ))}
          </div>
        </section>
      )}

      <section className="pt-9">
        <SectionHead title="On the house" sub="What being approved gets you" />
        <div className="rail">
          {offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      </section>

      <HowItWorks />

      {rest.length > 0 && (
        <section className="pt-9">
          <SectionHead title="More rooms" href="/clubs" />
          <div className="grid grid-cols-2 gap-3 px-4">
            {rest.slice(0, 8).map((c) => (
              <ClubCard key={c.id} club={c} width="w-full" />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/* This genuinely is a sequence, so it's numbered. */
function HowItWorks() {
  const steps = [
    { t: "Pick your night", d: "Choose a club and a date. Applications open a week ahead." },
    { t: "Tell us who's coming", d: "Girls, couple or guys — plus names and a number we can reach." },
    { t: "Watch for the 6 PM email", d: "Approved means walk in free. Food and drinks are covered." },
  ];
  return (
    <section className="px-4 pt-10">
      <h2 className="text-[19px]">How the list works</h2>
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
              <p className="mt-1 max-w-[38ch] text-[13px] leading-relaxed text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
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
    <footer className="mt-14 border-t border-line px-4 py-8 text-[12.5px] text-faint lg:hidden">
      <p className="font-display text-[17px] font-extrabold text-text">
        Sync<span className="text-red">Out</span>
      </p>
      <p className="mt-2 max-w-[42ch] leading-relaxed">
        Guestlists for Delhi NCR. 21+ with a government photo ID. Entry stays at the venue&apos;s
        discretion and lists close at 6 PM on the day.
      </p>
      <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
        <Link href="/clubs">Clubs</Link>
        <Link href="/nights">Nights</Link>
        <Link href="/passes">Your passes</Link>
        <Link href="/admin">Admin</Link>
      </nav>
      <p className="mt-5 text-faint">© {new Date().getFullYear()} SyncOut Pvt Ltd</p>
    </footer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cachedClubs, cachedNights } from "@/lib/cache";
import { ClubCard, NightCard } from "@/components/Cards";
import { ElegantBackground } from "@/components/fx/Backgrounds";
import { MotionCard } from "@/components/motion/Reveal";
import { SectionHead } from "@/components/SectionHead";
import { JsonLd } from "@/components/JsonLd";
import { absUrl } from "@/lib/site";
import { cityName, isLiveCity, LIVE_CITIES } from "@/lib/cities";

export function generateStaticParams() {
  return LIVE_CITIES.map((c) => ({ city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const { city } = await params;
  const name = cityName(city);
  return {
    title: `Best Clubs in ${name} — Guestlist & Free Entry`,
    description: `Get on the guestlist at the best clubs and bars in ${name}. Free entry for approved lists, food and drinks on many nights. Apply before 6 PM on SyncOut.`,
    alternates: { canonical: `/clubs/in/${city}` },
  };
}

export default async function ClubsInCity({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params;
  if (!isLiveCity(city)) notFound();
  const name = cityName(city);
  const [clubs, nights] = await Promise.all([cachedClubs(city, 80), cachedNights({ citySlug: city, limit: 9 })]);

  return (
    <>
      <ElegantBackground />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Clubs in ${name}`,
          itemListElement: clubs.slice(0, 30).map((c, i) => ({ "@type": "ListItem", position: i + 1, url: absUrl(`/clubs/${c.slug}`), name: c.name })),
        }}
      />
      <header className="px-4 pb-2 pt-6 lg:px-0">
        <h1 className="font-display text-[30px] font-extrabold tracking-tight lg:text-[40px]">Clubs in {name}</h1>
        <p className="mt-2 max-w-[62ch] text-[13.5px] leading-relaxed text-muted">
          {clubs.length} clubs and bars in {name} where SyncOut can put you on the guestlist. Apply before 6 PM on the day —
          approved lists walk in free, with food and drinks covered on many nights.
        </p>
      </header>

      {nights.length > 0 && (
        <section className="pt-6">
          <SectionHead title={`Coming up in ${name}`} href={`/nights?city=${city}`} />
          <div className="rail">
            {nights.map((n) => (
              <NightCard key={n.id} ev={{ ...n, startsAt: n.startsAt }} />
            ))}
          </div>
        </section>
      )}

      <section className="pt-8">
        <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-5 lg:px-0 xl:grid-cols-5">
          {clubs.map((c, i) => (
            <MotionCard key={c.id} index={i} columns={4}>
              <ClubCard club={c} width="w-full" />
            </MotionCard>
          ))}
        </div>
      </section>

      <p className="px-4 pt-10 text-[12.5px] text-faint lg:px-0">
        Also this month: <Link href={`/dandiya/${city}`} className="text-muted underline-offset-2 hover:underline">Dandiya nights in {name}</Link>.
      </p>
      <div className="h-8" />
    </>
  );
}

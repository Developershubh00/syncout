import { TopBar } from "@/components/TopBar";
import { CityRemember } from "@/components/CityRemember";
import { preferredCity } from "@/lib/city-pref";
import { ClubCard } from "@/components/Cards";
import { cachedClubs } from "@/lib/cache";
import { Empty } from "@/components/Empty";
import { ElegantBackground } from "@/components/fx/Backgrounds";
import { MotionCard } from "@/components/motion/Reveal";
import { LIVE_CITIES, isLiveCity, DEFAULT_CITY } from "@/lib/cities";

export const metadata = {
  title: "Clubs in Delhi, Gurugram & Noida — Guestlist & Free Entry",
  description: "Browse the best clubs and bars in Delhi NCR and get on the guestlist. Approved lists walk in free — apply before 6 PM.",
  alternates: { canonical: "/clubs" },
};

const CITIES = LIVE_CITIES.map((c) => ({ slug: c.slug, label: c.short }));

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: raw } = await searchParams;
  const { city, explicit } = await preferredCity(raw);
  const list = await cachedClubs(city, 80);

  return (
    <>
      <ElegantBackground />
      {explicit && <CityRemember city={city} />}
      <TopBar city={city} />

      <header className="px-4 pb-1 pt-5">
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Clubs</h1>
        <p className="mt-1 text-[13px] text-muted">
          {list.length} rooms we can put you on the list for.
        </p>
      </header>

      <div className="rail chips py-3.5">
        {CITIES.map((c) => (
          <a
            key={c.slug}
            href={`/clubs?city=${c.slug}`}
            className={
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium " +
              (c.slug === city ? "border-red bg-red/12 text-red-hot shadow-[0_6px_22px_-10px_rgba(228,17,60,.8)]" : "border-line text-muted transition-colors hover:text-text")
            }
          >
            {c.label}
          </a>
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 lg:grid-cols-4 lg:gap-5 lg:px-0 xl:grid-cols-5">
          {list.map((c, i) => (
            <MotionCard key={c.id} index={i} columns={4}>
              <ClubCard club={c} width="w-full" />
            </MotionCard>
          ))}
        </div>
      ) : (
        <Empty
          title="Nothing listed here yet"
          body="We're still signing venues in this city. Delhi, Gurugram and Noida are live now."
          cta={{ href: "/clubs?city=new-delhi", label: "See Delhi clubs" }}
        />
      )}
    </>
  );
}

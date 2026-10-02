import { TopBar } from "@/components/TopBar";
import { NightCard } from "@/components/Cards";
import { cachedNights } from "@/lib/cache";
import { friendlyDate } from "@/lib/utils";
import { Empty } from "@/components/Empty";
import { ElegantBackground } from "@/components/fx/Backgrounds";
import { DevDbHint } from "@/components/DevDbHint";
import { MotionCard } from "@/components/motion/Reveal";
import { isLiveCity, DEFAULT_CITY } from "@/lib/cities";

export const metadata = {
  title: "Club Nights This Week — Guestlists in Delhi NCR",
  description: "Every club night taking guestlist applications in Delhi, Gurugram and Noida. Lists close at 6 PM on the day.",
  alternates: { canonical: "/nights" },
};

export default async function NightsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city: raw } = await searchParams;
  const city = raw && isLiveCity(raw) ? raw : DEFAULT_CITY;
  const nights = await cachedNights({ citySlug: city, limit: 90 });

  // group by IST calendar day
  const groups = new Map<string, typeof nights>();
  for (const n of nights) {
    const key = friendlyDate(n.startsAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  return (
    <>
      <ElegantBackground />
      <TopBar city={city} />
      <header className="px-4 pb-2 pt-5">
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Nights</h1>
        <p className="mt-1 max-w-[40ch] text-[13px] leading-relaxed text-muted">
          Every night taking guestlist applications. Lists close at 6 PM on the day.
        </p>
      </header>

      {groups.size === 0 && (
        <Empty
          title="Nothing on for this city"
          body="The week's line-up goes up every Monday. Try Delhi, Gurugram or Noida."
          cta={city !== "new-delhi" ? { href: "/nights?city=new-delhi", label: "See Delhi nights" } : { href: "/events", label: "See Dandiya & events" }}
        />
      )}
      {groups.size === 0 && <DevDbHint />}

      {[...groups.entries()].map(([day, list]) => (
        <section key={day} className="pt-6">
          <div className="sticky top-[57px] z-20 bg-ink/90 px-4 py-2 backdrop-blur">
            <h2 className="text-[14px] font-semibold text-muted">{day}</h2>
          </div>
          <div className="mt-2 space-y-5 px-4 lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0 lg:px-0 xl:grid-cols-4">
            {list.map((n, i) => (
              <MotionCard key={n.id} index={i} columns={3}>
              <NightCard
                wide
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
        </section>
      ))}
      <div className="h-8" />
    </>
  );
}

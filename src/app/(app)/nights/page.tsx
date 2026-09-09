import { TopBar } from "@/components/TopBar";
import { NightCard } from "@/components/Cards";
import { cachedNights } from "@/lib/cache";
import { friendlyDate } from "@/lib/utils";
import { Empty } from "@/components/Empty";

export const revalidate = 120;
export const metadata = { title: "Nights" };

export default async function NightsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "new-delhi" } = await searchParams;
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
          cta={{ href: "/nights?city=new-delhi", label: "See Delhi nights" }}
        />
      )}

      {[...groups.entries()].map(([day, list]) => (
        <section key={day} className="pt-6">
          <div className="sticky top-[57px] z-20 bg-ink/90 px-4 py-2 backdrop-blur">
            <h2 className="text-[14px] font-semibold text-muted">{day}</h2>
          </div>
          <div className="mt-2 space-y-5 px-4">
            {list.map((n) => (
              <NightCard
                key={n.id}
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
            ))}
          </div>
        </section>
      ))}
      <div className="h-8" />
    </>
  );
}

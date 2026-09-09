import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { searchAll } from "@/lib/queries";
import { ClubCard, NightCard } from "@/components/Cards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const { q = "", city } = await searchParams;
  const res = q.trim().length >= 2 ? await searchAll(q.trim(), city) : null;

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line-soft bg-ink/90 px-3 py-3 backdrop-blur-xl">
        <Link href="/" aria-label="Back" className="rounded-full p-1.5 active:bg-raised">
          <ChevronLeft className="size-5" />
        </Link>
        <form action="/search" className="flex-1">
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Club, area or music"
            className="h-11 w-full rounded-2xl border border-line bg-raised px-4 text-[15px] placeholder:text-faint focus:border-red/60"
          />
        </form>
      </header>

      {!res && (
        <p className="px-4 pt-6 text-[13.5px] text-muted">
          Try &ldquo;Sector 29&rdquo;, &ldquo;techno&rdquo;, &ldquo;rooftop&rdquo; or a club name.
        </p>
      )}

      {res && res.clubs.length === 0 && res.nights.length === 0 && (
        <p className="px-4 pt-6 text-[13.5px] text-muted">
          Nothing matched &ldquo;{q}&rdquo;. Try a shorter word, or browse{" "}
          <Link href="/clubs" className="text-red-hot">all clubs</Link>.
        </p>
      )}

      {res && res.nights.length > 0 && (
        <section className="pt-5">
          <h2 className="px-4 text-[16px]">Nights</h2>
          <div className="mt-3 space-y-4 px-4">
            {res.nights.map((n) => (
              <NightCard
                key={n.id}
                wide
                ev={{
                  slug: n.slug, title: n.title, poster: n.poster, startsAt: n.startsAt,
                  artist: n.artist, musicType: n.musicType, clubName: n.clubName,
                  clubArea: n.clubArea, femalePrice: n.femalePrice,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {res && res.clubs.length > 0 && (
        <section className="pt-7">
          <h2 className="px-4 text-[16px]">Clubs</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 px-4">
            {res.clubs.map((c) => (
              <ClubCard key={c.id} club={c} width="w-full" />
            ))}
          </div>
        </section>
      )}
      <div className="h-8" />
    </>
  );
}

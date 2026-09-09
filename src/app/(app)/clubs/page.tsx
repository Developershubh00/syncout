import { TopBar } from "@/components/TopBar";
import { ClubCard } from "@/components/Cards";
import { getClubs } from "@/lib/queries";
import { Empty } from "@/components/Empty";

export const revalidate = 300;
export const metadata = { title: "Clubs" };

const CITIES = [
  { slug: "new-delhi", label: "Delhi" },
  { slug: "gurugram", label: "Gurugram" },
  { slug: "noida", label: "Noida" },
];

export default async function ClubsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  const { city = "new-delhi" } = await searchParams;
  const list = await getClubs(city, 80);

  return (
    <>
      <TopBar city={city} />

      <header className="px-4 pb-1 pt-5">
        <h1 className="font-display text-[27px] font-extrabold tracking-tight">Clubs</h1>
        <p className="mt-1 text-[13px] text-muted">
          {list.length} rooms we can put you on the list for.
        </p>
      </header>

      <div className="rail py-3.5">
        {CITIES.map((c) => (
          <a
            key={c.slug}
            href={`/clubs?city=${c.slug}`}
            className={
              "rounded-full border px-3.5 py-1.5 text-[13px] font-medium " +
              (c.slug === city ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")
            }
          >
            {c.label}
          </a>
        ))}
      </div>

      {list.length ? (
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {list.map((c) => (
            <ClubCard key={c.id} club={c} width="w-full" />
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

import Image from "next/image";
import Link from "next/link";
import { ClubGallery } from "@/components/ClubGallery";
import { InstagramPosts } from "@/components/InstagramPosts";
import { notFound } from "next/navigation";
import { Crown, ChevronLeft, MapPin, Clock, Star, Shirt, Phone, IndianRupee } from "lucide-react";
import { getNights, getClubReviews } from "@/lib/queries";
import { cachedClub } from "@/lib/cache";
import { ElegantBackground } from "@/components/fx/Backgrounds";
import { JsonLd } from "@/components/JsonLd";
import { absUrl } from "@/lib/site";
import { cityName } from "@/lib/cities";
import { NightCard } from "@/components/Cards";
import { rupees } from "@/lib/utils";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const club = await cachedClub((await params).slug);
  if (!club) return { title: "Club" };
  const city = cityName(club.citySlug);
  return {
    title: `${club.name}, ${club.area} — Guestlist & Free Entry in ${city}`,
    description: `${club.tagline ?? club.name}. Get on the ${club.name} guestlist in ${club.area}, ${city} — apply before 6 PM on SyncOut.`,
    alternates: { canonical: `/clubs/${club.slug}` },
    openGraph: club.coverImage ? { images: [club.coverImage] } : undefined,
  };
}

export default async function ClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const club = await cachedClub((await params).slug);
  if (!club || !club.isActive) notFound();

  const [nights, reviews] = await Promise.all([
    getNights({ clubId: club.id, limit: 12 }),
    getClubReviews(club.id),
  ]);

  return (
    <>
      <ElegantBackground />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NightClub",
          name: club.name,
          description: club.description ?? club.tagline ?? undefined,
          image: club.coverImage ? [club.coverImage] : undefined,
          url: absUrl(`/clubs/${club.slug}`),
          address: {
            "@type": "PostalAddress",
            streetAddress: club.address ?? club.area,
            addressLocality: cityName(club.citySlug),
            addressCountry: "IN",
          },
          ...(club.priceForTwo ? { priceRange: `₹${club.priceForTwo} for two` } : {}),
          ...(club.phone ? { telephone: club.phone } : {}),
        }}
      />
      {/* hero */}
      <div className="relative aspect-[4/3] w-full">
        {club.coverImage && (
          <Image src={club.coverImage} alt="" fill priority sizes="512px" className="object-cover" />
        )}
        <div className="scrim absolute inset-x-0 bottom-0 h-3/4" />
        <Link
          href="/clubs"
          aria-label="Back to clubs"
          className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-ink/65 backdrop-blur"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <div className="absolute inset-x-0 bottom-0 p-4">
          <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-tight">
            {club.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
            <MapPin className="size-3.5" />
            {club.area}
            {club.rating ? (
              <>
                <span className="text-faint">·</span>
                <Star className="size-3.5 fill-gold text-gold" />
                <span className="text-text">{club.rating.toFixed(1)}</span>
                <span className="text-faint">({club.reviewCount})</span>
              </>
            ) : null}
          </p>
        </div>
      </div>

      {club.inHouse && (
        <div className="mx-4 mt-4 rounded-[20px] border border-gold/40 bg-gradient-to-br from-gold/[0.12] to-transparent p-4 lg:mx-0">
          <p className="flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-wider text-gold">
            <Crown className="size-4" /> SyncOut House
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-white/85">One of our own clubs — our team runs the door, so the list you&apos;re on is the list they check.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Premium crowd", "Food & drinks", "Our team on the door"].map((t) => (
              <span key={t} className="rounded-full border border-gold/30 bg-ink/40 px-3 py-1 text-[12px] font-semibold text-gold">{t}</span>
            ))}
          </div>
        </div>
      )}
      {club.tagline && (
        <p className="px-4 pt-4 font-display text-[17px] leading-snug text-text">{club.tagline}</p>
      )}
      {club.description && (
        <p className="px-4 pt-2.5 text-[13.5px] leading-relaxed text-muted">{club.description}</p>
      )}

      {/* facts */}
      <dl className="mt-5 grid grid-cols-2 gap-2.5 px-4">
        <Fact icon={<Clock className="size-4" />} k="Doors" v={`${club.openTime} – ${club.closeTime}`} />
        <Fact icon={<IndianRupee className="size-4" />} k="For two" v={club.priceForTwo ? rupees(club.priceForTwo) : "—"} />
        <Fact icon={<Shirt className="size-4" />} k="Dress code" v={club.dressCode ?? "Smart casuals"} span />
        {club.address && <Fact icon={<MapPin className="size-4" />} k="Address" v={club.address} span />}
        {club.phone && <Fact icon={<Phone className="size-4" />} k="Phone" v={club.phone} span />}
      </dl>

      {club.musicTypes.length > 0 && (
        <div className="mt-5 px-4">
          <p className="text-[13px] font-medium text-muted">Music</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {club.musicTypes.map((m) => (
              <span key={m} className="rounded-full border border-line px-3 py-1 text-[12.5px]">
                {m}
              </span>
            ))}
          </div>

      <ClubGallery photos={(club.gallery ?? []).filter((u) => u && !u.endsWith(".svg"))} name={club.name} />
      <InstagramPosts handle={club.instagram ?? null} posts={club.instagramPosts ?? []} />
        </div>
      )}

      {/* nights */}
      <section className="pt-8">
        <h2 className="px-4 text-[19px]">Nights here</h2>
        {nights.length ? (
          <div className="mt-3 space-y-4 px-4">
            {nights.map((n) => (
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
        ) : (
          <p className="mt-3 px-4 text-[13.5px] text-muted">
            No dates listed right now. New nights go up every Monday.
          </p>
        )}
      </section>

      {reviews.length > 0 && (
        <section className="px-4 pt-9">
          <h2 className="text-[19px]">What people said</h2>
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <figure key={r.id} className="rounded-[18px] border border-line bg-surface p-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} className="size-3.5 fill-gold text-gold" />
                  ))}
                </div>
                <blockquote className="mt-2 text-[13.5px] leading-relaxed text-muted">{r.body}</blockquote>
                <figcaption className="mt-2.5 text-[12.5px] font-semibold">{r.authorName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <div className="h-10" />
    </>
  );
}

function Fact({ icon, k, v, span }: { icon: React.ReactNode; k: string; v: string; span?: boolean }) {
  return (
    <div className={"rounded-2xl border border-line bg-surface p-3.5 " + (span ? "col-span-2" : "")}>
      <dt className="flex items-center gap-1.5 text-[12px] text-faint">
        {icon}
        {k}
      </dt>
      <dd className="mt-1 text-[13.5px] leading-snug">{v}</dd>
    </div>
  );
}

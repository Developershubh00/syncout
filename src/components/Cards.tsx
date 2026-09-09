import Link from "next/link";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { friendlyDate, fmtTime, rupees, cn } from "@/lib/utils";

const FALLBACK =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#1b1b21"/></svg>`
  );

/* ── club: portrait poster with the name sitting on the photo ── */
export function ClubCard({
  club,
  width = "w-[164px]",
}: {
  club: { slug: string; name: string; area: string; coverImage: string | null; rating: number | null; priceForTwo: number | null; musicTypes: string[] };
  width?: string;
}) {
  return (
    <Link href={`/clubs/${club.slug}`} className={cn("group block", width)}>
      <div className="relative aspect-[3/4] overflow-hidden rounded-[18px] bg-raised">
        <Image
          src={club.coverImage || FALLBACK}
          alt=""
          fill
          sizes="180px"
          className="object-cover transition-transform duration-500 group-active:scale-[1.04]"
        />
        <div className="scrim absolute inset-x-0 bottom-0 h-3/5" />
        {club.rating ? (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-ink/75 px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur">
            <Star className="size-3 fill-gold text-gold" />
            {club.rating.toFixed(1)}
          </span>
        ) : null}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="line-clamp-2 text-[14px] font-bold leading-tight">{club.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted">{club.area}</p>
        </div>
      </div>
    </Link>
  );
}

/* ── night: landscape poster, date badge, guestlist status ── */
export function NightCard({
  ev,
  wide,
}: {
  ev: {
    slug: string;
    title: string;
    poster: string | null;
    startsAt: Date | string;
    artist: string | null;
    musicType: string | null;
    clubName: string;
    clubArea: string;
    femalePrice?: number;
  };
  wide?: boolean;
}) {
  const d = new Date(ev.startsAt);
  return (
    <Link href={`/nights/${ev.slug}`} className={cn("group block", wide ? "w-full" : "w-[270px]")}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-[18px] bg-raised">
        <Image
          src={ev.poster || FALLBACK}
          alt=""
          fill
          sizes={wide ? "(max-width:512px) 100vw, 512px" : "290px"}
          className="object-cover transition-transform duration-500 group-active:scale-[1.04]"
        />
        <div className="scrim absolute inset-x-0 bottom-0 h-2/3" />
        <span className="absolute left-2.5 top-2.5 rounded-lg bg-red px-2 py-1 text-[11px] font-bold tracking-tight">
          {friendlyDate(d)}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="line-clamp-1 text-[16px] font-bold leading-tight">{ev.title}</h3>
          <p className="mt-1 line-clamp-1 flex items-center gap-1 text-[12px] text-muted">
            <MapPin className="size-3 shrink-0" />
            {ev.clubName} · {ev.clubArea}
          </p>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 px-0.5 text-[12px] text-muted">
        <span className="text-text">{fmtTime(d)}</span>
        {ev.musicType && <span className="text-faint">{ev.musicType}</span>}
        <span className="ml-auto font-semibold text-gold">{rupees(ev.femalePrice ?? 0)} on the list</span>
      </p>
    </Link>
  );
}

/* ── offer: text-led, no photo competing with the message ── */
export function OfferCard({
  offer,
}: {
  offer: { title: string; subtitle: string | null; description: string | null; image: string | null };
}) {
  return (
    <article className="relative w-[276px] overflow-hidden rounded-[18px] border border-line bg-surface p-4">
      <div className="absolute -right-6 -top-8 size-28 rounded-full bg-red/12 blur-2xl" />
      <p className="text-[11.5px] font-semibold text-gold">{offer.subtitle}</p>
      <h3 className="mt-1.5 text-[17px] leading-tight">{offer.title}</h3>
      <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted">{offer.description}</p>
    </article>
  );
}

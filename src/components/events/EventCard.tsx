import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { datesLabel, timeLabel, rs } from "@/lib/event-format";
import { categoryLabel } from "@/lib/event-labels";
import { cityName } from "@/lib/cities";
import { cn } from "@/lib/utils";

export type EventCardData = {
  slug: string;
  title: string;
  poster: string | null;
  startsAt: Date | string;
  days: string[];
  timeLabel: string | null;
  venueName: string;
  area: string | null;
  citySlug: string;
  category: string;
  fromPrice: number | null;
};

export function EventCard({ ev, wide, priority }: { ev: EventCardData; wide?: boolean; priority?: boolean }) {
  return (
    <Link href={`/events/${ev.slug}`} className={cn("group block", wide ? "w-full" : "w-[280px]")}>
      <div className="ev-card relative aspect-[16/10] overflow-hidden rounded-[20px] bg-raised">
        <Image
          src={ev.poster || "/events/events-hero.svg"}
          alt={`${ev.title} — ${categoryLabel(ev.category)} in ${cityName(ev.citySlug)}`}
          fill
          priority={priority}
          sizes={wide ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "290px"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05] group-active:scale-[1.03]"
        />
        <div className="scrim absolute inset-x-0 bottom-0 h-3/4" />
        <span className="absolute left-2.5 top-2.5 rounded-lg bg-gradient-to-r from-[#ff2bd6] to-[#ff8a00] px-2 py-1 text-[11px] font-bold text-white shadow-lg">
          {datesLabel(ev)}
        </span>
        <span className="absolute right-2.5 top-2.5 rounded-lg bg-ink/70 px-2 py-1 text-[11px] font-semibold text-gold backdrop-blur">
          {categoryLabel(ev.category)}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="line-clamp-2 text-[16px] font-bold leading-tight">{ev.title}</h3>
          <p className="mt-1 line-clamp-1 flex items-center gap-1 text-[12px] text-white/75">
            <MapPin className="size-3 shrink-0" />
            {ev.venueName} · {cityName(ev.citySlug, true)}
          </p>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 px-0.5 text-[12px] text-muted">
        <span className="text-text">{timeLabel(ev)}</span>
        <span className="ml-auto font-semibold text-gold">{ev.fromPrice ? `from ${rs(ev.fromPrice)}` : "Free entry"}</span>
      </p>
    </Link>
  );
}

export function toCard(e: EventCardData): EventCardData {
  return {
    slug: e.slug,
    title: e.title,
    poster: e.poster,
    startsAt: e.startsAt,
    days: e.days,
    timeLabel: e.timeLabel,
    venueName: e.venueName,
    area: e.area,
    citySlug: e.citySlug,
    category: e.category,
    fromPrice: e.fromPrice,
  };
}

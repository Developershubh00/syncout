import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
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
    <Link
      href={`/events/${ev.slug}`}
      className={cn(
        "group block rounded-[26px] border border-white/[0.06] bg-surface p-2.5 shadow-[0_14px_34px_-22px_rgba(0,0,0,.95)] transition-colors hover:border-[#ff2bd6]/30",
        wide ? "w-full" : "w-[272px]"
      )}
    >
      <div className={cn("ev-card relative overflow-hidden rounded-[20px] bg-raised", wide ? "aspect-[16/10]" : "aspect-[4/3]")}>
        <Image
          src={ev.poster || "/events/events-hero.svg"}
          alt={`${ev.title} — ${categoryLabel(ev.category)} in ${cityName(ev.citySlug)}`}
          fill
          priority={priority}
          sizes={wide ? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" : "280px"}
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05] group-active:scale-[1.03]"
        />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-gold backdrop-blur">{categoryLabel(ev.category)}</span>
        <span className="absolute right-2.5 top-2.5 rounded-full bg-gradient-to-r from-[#ff2bd6] to-[#e4113c] px-2.5 py-1 text-[11px] font-bold text-white shadow-lg">
          {ev.fromPrice ? `from ${rs(ev.fromPrice)}` : "Free"}
        </span>
      </div>
      <div className="px-1.5 pb-1 pt-3">
        <h3 className="line-clamp-1 text-[16px] font-bold leading-tight">{ev.title}</h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-muted">
          <CalendarDays className="size-3.5 shrink-0 text-[#ff6ad5]" />
          <span className="truncate">{datesLabel(ev)} · {timeLabel(ev)}</span>
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-muted">
          <MapPin className="size-3.5 shrink-0 text-gold" />
          <span className="truncate">{ev.venueName} · {cityName(ev.citySlug, true)}</span>
        </p>
      </div>
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

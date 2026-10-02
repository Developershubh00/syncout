import type { z } from "zod";
import type { ticketedEventSchema } from "@/lib/validators";
import { istAt, istDateKey } from "@/lib/guestlist";

type Input = z.infer<typeof ticketedEventSchema>;

/** Form input → table values. Fills in an end time when none was given. */
export function eventValues(d: Input): { ok: false; error: string } | { ok: true; event: ReturnType<typeof build> } {
  const start = new Date(d.startsAt);
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Pick a start date and time" };
  return { ok: true, event: build(d, start) };
}

function build(d: Input, start: Date) {

  const days = [...new Set(d.days)].sort();
  let end = d.endsAt ? new Date(d.endsAt) : null;
  if (end && Number.isNaN(end.getTime())) end = null;
  if (!end) {
    const last = days.length ? days[days.length - 1] : istDateKey(start);
    const ist = new Date(start.getTime() + 330 * 60000);
    end = new Date(istAt(last, ist.getUTCHours(), ist.getUTCMinutes()).getTime() + 5 * 3600e3);
  }

  return {
      title: d.title,
      slug: d.slug,
      category: d.category,
      citySlug: d.citySlug,
      venueName: d.venueName,
      area: d.area || null,
      address: d.address || null,
      mapUrl: d.mapUrl || null,
      startsAt: start,
      endsAt: end,
      days,
      timeLabel: d.timeLabel || null,
      poster: d.poster || null,
      gallery: d.gallery,
      description: d.description || null,
      highlights: d.highlights.filter(Boolean),
      organizer: d.organizer || null,
      ageLimit: d.ageLimit || null,
      dressCode: d.dressCode || null,
      terms: d.terms || null,
      bookingMode: d.bookingMode,
      externalUrl: d.externalUrl || null,
      sourceUrl: d.sourceUrl || null,
      salesOpen: d.salesOpen,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
  };
}

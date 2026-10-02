import type { MetadataRoute } from "next";
import { db } from "@/db";
import { clubs, events, ticketedEvents } from "@/db/schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { absUrl } from "@/lib/site";
import { LIVE_CITIES } from "@/lib/cities";
import { DEFAULT_OPENINGS } from "@/data/careers";

// Rebuilt hourly so new events and nights show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: absUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absUrl("/dandiya"), changeFrequency: "daily", priority: 0.95 },
    { url: absUrl("/events"), changeFrequency: "daily", priority: 0.9 },
    { url: absUrl("/nights"), changeFrequency: "daily", priority: 0.8 },
    { url: absUrl("/clubs"), changeFrequency: "weekly", priority: 0.8 },
    { url: absUrl("/careers"), changeFrequency: "weekly", priority: 0.6 },
    { url: absUrl("/contact"), changeFrequency: "monthly", priority: 0.4 },
    { url: absUrl("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absUrl("/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absUrl("/refunds"), changeFrequency: "yearly", priority: 0.2 },
    ...DEFAULT_OPENINGS.map((o) => ({ url: absUrl(`/careers/${o.slug}`), changeFrequency: "weekly" as const, priority: 0.5 })),
    ...LIVE_CITIES.flatMap((c) => [
      { url: absUrl(`/dandiya/${c.slug}`), changeFrequency: "daily" as const, priority: 0.9 },
      { url: absUrl(`/events/in/${c.slug}`), changeFrequency: "daily" as const, priority: 0.8 },
      { url: absUrl(`/clubs/in/${c.slug}`), changeFrequency: "weekly" as const, priority: 0.8 },
    ]),
  ];

  try {
    const [evs, nights, venues] = await Promise.all([
      db
        .select({ slug: ticketedEvents.slug, at: ticketedEvents.createdAt })
        .from(ticketedEvents)
        .where(and(eq(ticketedEvents.isActive, true), sql`coalesce(${ticketedEvents.endsAt}, ${ticketedEvents.startsAt}) >= now()`)),
      db
        .select({ slug: events.slug, at: events.createdAt })
        .from(events)
        .where(and(eq(events.isActive, true), gte(events.startsAt, now)))
        .limit(500),
      db.select({ slug: clubs.slug, at: clubs.createdAt }).from(clubs).where(eq(clubs.isActive, true)),
    ]);
    return [
      ...fixed,
      ...evs.map((e) => ({ url: absUrl(`/events/${e.slug}`), lastModified: e.at, changeFrequency: "daily" as const, priority: 0.85 })),
      ...venues.map((c) => ({ url: absUrl(`/clubs/${c.slug}`), lastModified: c.at, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...nights.map((n) => ({ url: absUrl(`/nights/${n.slug}`), lastModified: n.at, changeFrequency: "daily" as const, priority: 0.5 })),
    ];
  } catch {
    return fixed;
  }
}

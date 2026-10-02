/**
 * Seeding pieces shared by `npm run db:seed` and Admin → Set up.
 * Everything here only ADDS rows (on conflict do nothing) — never updates or deletes.
 */
import { asc } from "drizzle-orm";
import { db } from "./index";
import { announcements, cities, clubs, events, jobOpenings, settings, ticketTiers, ticketedEvents } from "./schema";
import { DEFAULT_OPENINGS } from "../data/careers";
import { CITIES, CLUBS, EVENT_TEMPLATES } from "../data/venues";
import { NCR_CLUBS } from "../data/venues-ncr";
import { GALLERIA_CLUBS } from "../data/venues-galleria";
import { DANDIYA_2026, DANDIYA_ANNOUNCEMENT } from "../data/events-2026";
import { slugify } from "../lib/utils";
import { istAt } from "../lib/guestlist";
import { DEFAULT_SETTINGS } from "../lib/settings.defaults";

const ALL_CLUBS = [...GALLERIA_CLUBS, ...CLUBS, ...NCR_CLUBS];

function nightAt(daysAhead: number, hour = 21) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  // IST is UTC+5:30, so 21:00 IST == 15:30 UTC.
  d.setUTCHours(hour - 6, 30, 0, 0);
  return d;
}

export async function seedCitiesAndClubs() {
  await db.insert(cities).values(CITIES.map((c) => ({ ...c, isActive: true }))).onConflictDoNothing({ target: cities.slug });
  const added = await db
    .insert(clubs)
    .values(
      ALL_CLUBS.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        citySlug: c.citySlug,
        area: c.area,
        address: c.address ?? null,
        tagline: c.tagline,
        description: c.description,
        coverImage: c.coverImage,
        gallery: c.coverImage ? [c.coverImage] : [],
        musicTypes: c.musicTypes,
        tags: c.tags,
        priceForTwo: c.priceForTwo,
        openTime: c.openTime,
        closeTime: c.closeTime,
        dressCode: c.dressCode ?? "Smart casuals. No shorts, no slippers.",
        rating: c.rating,
        reviewCount: c.reviewCount,
        isFeatured: c.isFeatured ?? false,
        inHouse: c.inHouse ?? false,
        instagram: c.instagram ?? null,
        sortOrder: i,
      }))
    )
    .onConflictDoNothing({ target: clubs.slug })
    .returning({ id: clubs.id });
  return added.length;
}

/** Template nights at your active clubs for the next 14 days (skips any that exist). */
export async function seedNights(days = 14) {
  const allClubs = await db.select().from(clubs).orderBy(asc(clubs.sortOrder), asc(clubs.name));
  const rows: (typeof events.$inferInsert)[] = [];
  for (let day = 0; day < days; day++) {
    const date = nightAt(day);
    const weekday = date.getUTCDay();
    const tpl = EVENT_TEMPLATES.find((t) => t.weekday === weekday);
    if (!tpl) continue;
    const hosts = allClubs.filter((c, i) => c.isActive && (i + day) % 3 === 0);
    for (const club of hosts) {
      rows.push({
        clubId: club.id,
        title: tpl.title,
        slug: slugify(`${club.slug}-${tpl.title}-${date.toISOString().slice(0, 10)}`),
        description: `${tpl.title} at ${club.name}. ${club.tagline ?? ""} Doors ${club.openTime}, guestlist confirmed by 6 PM.`,
        poster: club.coverImage,
        gallery: club.gallery,
        artist: tpl.artist,
        musicType: tpl.musicType,
        startsAt: date,
        endsAt: new Date(date.getTime() + 4 * 3600e3),
        guestlistOpen: true,
        cutoffHour: 18,
        femaleLimit: 40,
        coupleLimit: 30,
        maleEnabled: weekday !== 3, // guys' list shut on Ladies Night
        maleLimit: 15,
        perks: tpl.perks,
        isFeatured: club.isFeatured && day < 4,
      });
    }
  }
  let added = 0;
  for (let i = 0; i < rows.length; i += 40) {
    const r = await db.insert(events).values(rows.slice(i, i + 40)).onConflictDoNothing({ target: events.slug }).returning({ id: events.id });
    added += r.length;
  }
  return added;
}

/** The Navratri 2026 events, the Dandiya popup and default settings. */
export async function seedNavratri() {
  let added = 0;
  for (const [i, e] of DANDIYA_2026.entries()) {
    const days = [...e.days].sort();
    const [h, m] = e.time.split(":").map(Number);
    const startsAt = istAt(days[0], h, m);
    const endsAt = new Date(istAt(days[days.length - 1], h, m).getTime() + e.hours * 3600e3);
    const [ev] = await db
      .insert(ticketedEvents)
      .values({
        slug: e.slug,
        title: e.title,
        category: e.category,
        citySlug: e.citySlug,
        venueName: e.venueName,
        area: e.area ?? null,
        address: e.address ?? null,
        startsAt,
        endsAt,
        days: days.length > 1 ? days : [],
        timeLabel: e.timeLabel ?? null,
        poster: `/events/${e.slug}.svg`,
        description: e.description,
        highlights: e.highlights,
        ageLimit: e.ageLimit ?? null,
        terms: e.terms ?? null,
        bookingMode: "upi",
        sourceUrl: e.sourceUrl,
        isFeatured: e.isFeatured ?? false,
        sortOrder: i,
      })
      .onConflictDoNothing({ target: ticketedEvents.slug })
      .returning({ id: ticketedEvents.id });
    if (!ev) continue;
    added++;
    await db.insert(ticketTiers).values(
      e.tiers.map((t, j) => ({
        eventId: ev.id,
        name: t.name,
        description: t.description ?? null,
        price: t.price,
        admits: t.admits ?? 1,
        perOrderMax: 10,
        sortOrder: j,
      }))
    );
  }
  await db
    .insert(announcements)
    .values({ ...DANDIYA_ANNOUNCEMENT, endsAt: new Date(DANDIYA_ANNOUNCEMENT.endsAt) })
    .onConflictDoNothing({ target: announcements.slug });
  await db
    .insert(settings)
    .values({ key: "site", value: DEFAULT_SETTINGS as unknown as Record<string, unknown> })
    .onConflictDoNothing({ target: settings.key });
  return added;
}

/** Default job, internship and volunteer openings (skips any slug that exists). */
export async function seedCareers() {
  const r = await db
    .insert(jobOpenings)
    .values(DEFAULT_OPENINGS.map((o, i) => ({ ...o, sortOrder: i })))
    .onConflictDoNothing({ target: jobOpenings.slug })
    .returning({ id: jobOpenings.id });
  return r.length;
}

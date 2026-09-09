import "server-only";
import { db } from "@/db";
import { clubs, events, offers, bookings, reviews } from "@/db/schema";
import { and, asc, desc, eq, gte, sql, ilike, or, count } from "drizzle-orm";

const now = () => new Date();

/* ────────────────────────────────────────────────────────────────
   Reads fail soft.

   Before Neon is wired up — or if the database blips mid-request —
   a screen should show its empty state, not a 500. Writes are left
   alone: those still throw so the API can report a real failure.
   ──────────────────────────────────────────────────────────────── */

let warnedNoUrl = false;

function report(err: unknown, label: string) {
  if (!process.env.DATABASE_URL) {
    if (!warnedNoUrl) {
      warnedNoUrl = true;
      console.warn(
        "\n[syncout] DATABASE_URL is not set, so every screen will look empty.\n" +
          "          Add it to .env.local, then: npm run db:push && npm run db:seed\n"
      );
    }
    return;
  }
  console.error(`[syncout] query failed (${label}) —`, err);
}

function safe<A extends unknown[], R>(fn: (...args: A) => Promise<R>, fallback: R) {
  return async (...args: A): Promise<R> => {
    try {
      return await fn(...args);
    } catch (err) {
      report(err, fn.name.replace(/^_/, ""));
      return fallback;
    }
  };
}



async function _getClubs(citySlug?: string, limit = 60) {
  return db
    .select()
    .from(clubs)
    .where(and(eq(clubs.isActive, true), citySlug ? eq(clubs.citySlug, citySlug) : undefined))
    .orderBy(desc(clubs.isFeatured), asc(clubs.sortOrder))
    .limit(limit);
}

async function _getClub(slug: string) {
  const [row] = await db.select().from(clubs).where(eq(clubs.slug, slug)).limit(1);
  return row ?? null;
}

const joined = {
  id: events.id,
  slug: events.slug,
  title: events.title,
  poster: events.poster,
  gallery: events.gallery,
  description: events.description,
  artist: events.artist,
  musicType: events.musicType,
  startsAt: events.startsAt,
  endsAt: events.endsAt,
  guestlistOpen: events.guestlistOpen,
  cutoffHour: events.cutoffHour,
  femaleEnabled: events.femaleEnabled,
  femaleLimit: events.femaleLimit,
  femalePrice: events.femalePrice,
  coupleEnabled: events.coupleEnabled,
  coupleLimit: events.coupleLimit,
  couplePrice: events.couplePrice,
  maleEnabled: events.maleEnabled,
  maleLimit: events.maleLimit,
  malePrice: events.malePrice,
  perks: events.perks,
  isFeatured: events.isFeatured,
  clubId: clubs.id,
  clubSlug: clubs.slug,
  clubName: clubs.name,
  clubArea: clubs.area,
  clubCity: clubs.citySlug,
  clubAddress: clubs.address,
  clubMapUrl: clubs.mapUrl,
  clubDressCode: clubs.dressCode,
  clubOpenTime: clubs.openTime,
};

export type NightRow = Awaited<ReturnType<typeof _getNights>>[number];

async function _getNights(opts: { citySlug?: string; clubId?: string; limit?: number } = {}) {
  return db
    .select(joined)
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .where(
      and(
        eq(events.isActive, true),
        gte(events.startsAt, new Date(now().getTime() - 6 * 3600e3)),
        opts.citySlug ? eq(clubs.citySlug, opts.citySlug) : undefined,
        opts.clubId ? eq(events.clubId, opts.clubId) : undefined
      )
    )
    .orderBy(asc(events.startsAt))
    .limit(opts.limit ?? 60);
}

async function _getNight(slug: string) {
  const [row] = await db
    .select(joined)
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .where(eq(events.slug, slug))
    .limit(1);
  return row ?? null;
}

async function _getOffers() {
  return db.select().from(offers).where(eq(offers.isActive, true)).orderBy(asc(offers.sortOrder));
}

async function _getClubReviews(clubId: string) {
  return db
    .select()
    .from(reviews)
    .where(and(eq(reviews.clubId, clubId), eq(reviews.isApproved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(10);
}

/** Seats already taken per entry type, so we can show "3 spots left". */
async function _getEventCounts(eventId: string) {
  const rows = await db
    .select({
      entryType: bookings.entryType,
      guests: sql<number>`coalesce(sum(${bookings.totalGuests}), 0)`.mapWith(Number),
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.eventId, eventId),
        or(eq(bookings.status, "approved"), eq(bookings.status, "pending"), eq(bookings.status, "checked_in"))!
      )
    )
    .groupBy(bookings.entryType);

  const out = { stag_female: 0, couple: 0, stag_male: 0, group: 0 } as Record<string, number>;
  for (const r of rows) out[r.entryType] = r.guests;
  return out;
}

async function _searchAll(q: string, citySlug?: string) {
  const term = `%${q}%`;
  const clubHits = await db
    .select()
    .from(clubs)
    .where(
      and(
        eq(clubs.isActive, true),
        citySlug ? eq(clubs.citySlug, citySlug) : undefined,
        or(ilike(clubs.name, term), ilike(clubs.area, term), ilike(clubs.tagline, term))
      )
    )
    .limit(20);

  const nightHits = await db
    .select(joined)
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .where(
      and(
        eq(events.isActive, true),
        gte(events.startsAt, new Date(now().getTime() - 6 * 3600e3)),
        or(ilike(events.title, term), ilike(events.artist, term), ilike(events.musicType, term))
      )
    )
    .orderBy(asc(events.startsAt))
    .limit(20);

  return { clubs: clubHits, nights: nightHits };
}

async function _getUserBookings(userId: string) {
  return db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      entryType: bookings.entryType,
      totalGuests: bookings.totalGuests,
      createdAt: bookings.createdAt,
      guestName: bookings.guestName,
      rejectionReason: bookings.rejectionReason,
      eventTitle: events.title,
      eventSlug: events.slug,
      startsAt: events.startsAt,
      poster: events.poster,
      perks: events.perks,
      clubName: clubs.name,
      clubArea: clubs.area,
      clubAddress: clubs.address,
      clubMapUrl: clubs.mapUrl,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(eq(bookings.userId, userId))
    .orderBy(desc(bookings.createdAt));
}

async function _getBookingByCode(code: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      entryType: bookings.entryType,
      totalGuests: bookings.totalGuests,
      femaleCount: bookings.femaleCount,
      maleCount: bookings.maleCount,
      guestName: bookings.guestName,
      guestPhone: bookings.guestPhone,
      guestEmail: bookings.guestEmail,
      arrivalTime: bookings.arrivalTime,
      notes: bookings.notes,
      rejectionReason: bookings.rejectionReason,
      createdAt: bookings.createdAt,
      eventTitle: events.title,
      eventSlug: events.slug,
      startsAt: events.startsAt,
      poster: events.poster,
      perks: events.perks,
      cutoffHour: events.cutoffHour,
      clubName: clubs.name,
      clubArea: clubs.area,
      clubAddress: clubs.address,
      clubMapUrl: clubs.mapUrl,
      clubDressCode: clubs.dressCode,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(eq(bookings.code, code))
    .limit(1);
  return row ?? null;
}

/* ── admin ── */

async function _adminStats() {
  const [[b], [pending], [c], [e]] = await Promise.all([
    db.select({ n: count() }).from(bookings),
    db.select({ n: count() }).from(bookings).where(eq(bookings.status, "pending")),
    db.select({ n: count() }).from(clubs),
    db.select({ n: count() }).from(events).where(gte(events.startsAt, new Date())),
  ]);
  return { bookings: b.n, pending: pending.n, clubs: c.n, upcoming: e.n };
}

async function _adminBookings(status?: string, limit = 200) {
  return db
    .select({
      id: bookings.id,
      code: bookings.code,
      status: bookings.status,
      entryType: bookings.entryType,
      femaleCount: bookings.femaleCount,
      maleCount: bookings.maleCount,
      totalGuests: bookings.totalGuests,
      guestName: bookings.guestName,
      guestPhone: bookings.guestPhone,
      guestEmail: bookings.guestEmail,
      guestInstagram: bookings.guestInstagram,
      arrivalTime: bookings.arrivalTime,
      notes: bookings.notes,
      idProofUrl: bookings.idProofUrl,
      createdAt: bookings.createdAt,
      eventTitle: events.title,
      startsAt: events.startsAt,
      clubName: clubs.name,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(status && status !== "all" ? eq(bookings.status, status as "pending") : undefined)
    .orderBy(desc(bookings.createdAt))
    .limit(limit);
}

/* Public read API — every one of these degrades to an empty result. */
export const getClubs = safe(_getClubs, []);
export const getClub = safe(_getClub, null);
export const getNights = safe(_getNights, []);
export const getNight = safe(_getNight, null);
export const getOffers = safe(_getOffers, []);
export const getClubReviews = safe(_getClubReviews, []);
export const getEventCounts = safe(_getEventCounts, {
  stag_female: 0,
  couple: 0,
  stag_male: 0,
  group: 0,
} as Record<string, number>);
export const searchAll = safe(_searchAll, { clubs: [], nights: [] });
export const getUserBookings = safe(_getUserBookings, []);
export const getBookingByCode = safe(_getBookingByCode, null);
export const adminStats = safe(_adminStats, { bookings: 0, pending: 0, clubs: 0, upcoming: 0 });
export const adminBookings = safe(_adminBookings, []);

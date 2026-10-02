import "server-only";
import { db } from "@/db";
import { clubs, events, offers, bookings, reviews, ticketOrders, ticketedEvents } from "@/db/schema";
import { and, asc, desc, eq, gte, lt, sql, ilike, or, count, inArray } from "drizzle-orm";
import { istNightWindow, istDayStart } from "./guestlist";

const now = () => new Date();

/* ────────────────────────────────────────────────────────────────
   Reads fail soft.

   Before Neon is wired up — or if the database blips mid-request —
   a screen should show its empty state, not a 500. Writes are left
   alone: those still throw so the API can report a real failure.
   ──────────────────────────────────────────────────────────────── */

let warnedNoUrl = false;
let warnedSchema = false;

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
  const e = err as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  const text = `${e?.message ?? ""} ${e?.cause?.message ?? ""}`;
  if (e?.code === "42P01" || e?.cause?.code === "42P01" || /relation "[^"]+" does not exist/.test(text)) {
    if (!warnedSchema) {
      warnedSchema = true;
      console.warn(
        "\n[syncout] The database is missing tables, so some lists will look empty.\n" +
          "          Run: npm run db:upgrade && npm run db:seed   (or Admin → Overview → Set up)\n"
      );
    }
    return;
  }
  console.error(`[syncout] query failed (${label}) —`, err);
}

export function safe<A extends unknown[], R>(fn: (...args: A) => Promise<R>, fallback: R) {
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
  const [row] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.slug, slug), eq(clubs.isActive, true)))
    .limit(1);
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
    .where(and(eq(events.slug, slug), eq(events.isActive, true), eq(clubs.isActive, true)))
    .limit(1);
  return row ?? null;
}

async function _getOffers() {
  const at = now();
  const rows = await db
    .select()
    .from(offers)
    .where(
      and(
        eq(offers.isActive, true),
        // No end date means an evergreen perk; otherwise it must not have passed.
        or(sql`${offers.validTill} is null`, gte(offers.validTill, at))
      )
    )
    .orderBy(asc(offers.sortOrder));

  return rows.map((o) => ({
    ...o,
    /** Ends within 36h — the UI shows these as tonight's specials. */
    isToday: o.validTill
      ? o.validTill.getTime() - at.getTime() <= 36 * 60 * 60 * 1000
      : false,
  }));
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
  const term = `%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`;
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

  const eventHits = await db
    .select({
      id: ticketedEvents.id,
      slug: ticketedEvents.slug,
      title: ticketedEvents.title,
      poster: ticketedEvents.poster,
      startsAt: ticketedEvents.startsAt,
      days: ticketedEvents.days,
      timeLabel: ticketedEvents.timeLabel,
      venueName: ticketedEvents.venueName,
      area: ticketedEvents.area,
      citySlug: ticketedEvents.citySlug,
      category: ticketedEvents.category,
      fromPrice: sql<number | null>`(select min(t.price) from ticket_tiers t where t.event_id = ${ticketedEvents.id} and t.is_active)`.mapWith((v) => (v == null ? null : Number(v))),
    })
    .from(ticketedEvents)
    .where(
      and(
        eq(ticketedEvents.isActive, true),
        sql`coalesce(${ticketedEvents.endsAt}, ${ticketedEvents.startsAt}) >= now()`,
        citySlug ? eq(ticketedEvents.citySlug, citySlug) : undefined,
        or(
          ilike(ticketedEvents.title, term),
          ilike(ticketedEvents.venueName, term),
          ilike(ticketedEvents.area, term),
          ilike(ticketedEvents.category, term),
          ilike(ticketedEvents.citySlug, term)
        )
      )
    )
    .orderBy(asc(ticketedEvents.startsAt))
    .limit(20);

  return { clubs: clubHits, nights: nightHits, events: eventHits };
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
      userId: bookings.userId,
      eventId: bookings.eventId,
      clubSlug: clubs.slug,
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
  const at = now();
  const { from, to } = istNightWindow(at);
  const dayStart = istDayStart(at);
  const tonight = and(gte(events.startsAt, from), lt(events.startsAt, to));
  const live = or(eq(bookings.status, "approved"), eq(bookings.status, "checked_in"));

  const [[b], [pending], [c], [e], [nightsTonight], [approvedTonight], [headsTonight], [toVerify], [paidToday]] =
    await Promise.all([
      db.select({ n: count() }).from(bookings),
      db.select({ n: count() }).from(bookings).where(eq(bookings.status, "pending")),
      db.select({ n: count() }).from(clubs),
      db.select({ n: count() }).from(events).where(gte(events.startsAt, at)),
      db.select({ n: count() }).from(events).where(tonight),
      db
        .select({ n: count() })
        .from(bookings)
        .innerJoin(events, eq(bookings.eventId, events.id))
        .where(and(live, tonight)),
      db
        .select({ n: sql<number>`coalesce(sum(${bookings.totalGuests}), 0)::int` })
        .from(bookings)
        .innerJoin(events, eq(bookings.eventId, events.id))
        .where(and(live, tonight)),
      db.select({ n: count() }).from(ticketOrders).where(eq(ticketOrders.status, "payment_submitted")),
      db
        .select({ n: sql<number>`coalesce(sum(${ticketOrders.amount}), 0)::int` })
        .from(ticketOrders)
        .where(
          and(
            inArray(ticketOrders.status, ["confirmed", "checked_in"]),
            gte(ticketOrders.confirmedAt, dayStart)
          )
        ),
    ]);

  return {
    bookings: b.n,
    pending: pending.n,
    clubs: c.n,
    upcoming: e.n,
    tonight: nightsTonight.n,
    approved: approvedTonight.n,
    heads: Number(headsTonight.n),
    toVerify: toVerify.n,
    paidToday: Number(paidToday.n),
  };
}

/** Upcoming nights with their pending count, for the guestlist filter. */
async function _adminNightOptions() {
  return db
    .select({
      id: events.id,
      title: events.title,
      startsAt: events.startsAt,
      clubName: clubs.name,
      pending: sql<number>`count(${bookings.id}) filter (where ${bookings.status} = 'pending')`.mapWith(Number),
      total: sql<number>`count(${bookings.id})`.mapWith(Number),
    })
    .from(events)
    .innerJoin(clubs, eq(events.clubId, clubs.id))
    .leftJoin(bookings, eq(bookings.eventId, events.id))
    .where(gte(events.startsAt, new Date(now().getTime() - 12 * 3600e3)))
    .groupBy(events.id, clubs.name)
    .having(sql`count(${bookings.id}) > 0`)
    .orderBy(asc(events.startsAt))
    .limit(120);
}

async function _adminBookings(status?: string, limit = 200, eventId?: string, q?: string) {
  const term = q?.trim() ? `%${q.trim().replace(/[\\%_]/g, (c) => "\\" + c)}%` : null;
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
      eventId: bookings.eventId,
    })
    .from(bookings)
    .innerJoin(events, eq(bookings.eventId, events.id))
    .innerJoin(clubs, eq(bookings.clubId, clubs.id))
    .where(
      and(
        status && status !== "all" ? eq(bookings.status, status as "pending") : undefined,
        eventId ? eq(bookings.eventId, eventId) : undefined,
        term
          ? or(ilike(bookings.guestName, term), ilike(bookings.guestPhone, term), ilike(bookings.code, term), ilike(bookings.guestEmail, term))
          : undefined
      )
    )
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
export const searchAll = safe(_searchAll, { clubs: [], nights: [], events: [] });
export const getUserBookings = safe(_getUserBookings, []);
export const getBookingByCode = safe(_getBookingByCode, null);
export const adminStats = safe(_adminStats, {
  bookings: 0,
  pending: 0,
  clubs: 0,
  upcoming: 0,
  tonight: 0,
  approved: 0,
  heads: 0,
  toVerify: 0,
  paidToday: 0,
});
export const adminBookings = safe(_adminBookings, []);
export const adminNightOptions = safe(_adminNightOptions, []);

/** Unwrapped versions, for the cache layer — failures must throw there, not be cached as empty. */
export const raw = {
  getClubs: _getClubs,
  getClub: _getClub,
  getNights: _getNights,
  getNight: _getNight,
  getOffers: _getOffers,
};

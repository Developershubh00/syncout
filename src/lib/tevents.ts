import "server-only";
import { db } from "@/db";
import { ticketedEvents, ticketTiers, ticketOrders, users } from "@/db/schema";
import type { OrderStatus, TicketTier } from "@/db/schema";
import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from "drizzle-orm";
import { istDateKey } from "./guestlist";
import { safe } from "./queries";

export { CATEGORIES, categoryLabel, ORDER_STATUS } from "./event-labels";

/** Orders that hold tickets. Unpaid ones only while the hold window lasts. */
function holdingClause(holdHours: number) {
  const since = new Date(Date.now() - holdHours * 3600e3);
  return or(
    inArray(ticketOrders.status, ["payment_submitted", "confirmed", "checked_in"]),
    and(eq(ticketOrders.status, "awaiting_payment"), gte(ticketOrders.createdAt, since))
  )!;
}

/** IST days the event runs on, earliest first. */
export function eventDays(ev: { days: string[]; startsAt: Date | string }) {
  const list = (ev.days ?? []).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  return list.length ? list : [istDateKey(ev.startsAt)];
}

export function fromPrice(tiers: Pick<TicketTier, "price" | "isActive">[]) {
  const live = tiers.filter((t) => t.isActive);
  return live.length ? Math.min(...live.map((t) => t.price)) : null;
}

/* ── public reads ──────────────────────────────────────── */

const upcoming = () =>
  sql`coalesce(${ticketedEvents.endsAt}, ${ticketedEvents.startsAt} + interval '6 hours') >= now()`;

async function _listEvents(opts: { citySlug?: string; category?: string; limit?: number; featured?: boolean } = {}) {
  const rows = await db
    .select()
    .from(ticketedEvents)
    .where(
      and(
        eq(ticketedEvents.isActive, true),
        upcoming(),
        opts.citySlug ? eq(ticketedEvents.citySlug, opts.citySlug) : undefined,
        opts.category ? eq(ticketedEvents.category, opts.category) : undefined,
        opts.featured ? eq(ticketedEvents.isFeatured, true) : undefined
      )
    )
    .orderBy(desc(ticketedEvents.isFeatured), asc(ticketedEvents.startsAt), asc(ticketedEvents.sortOrder))
    .limit(opts.limit ?? 60);

  if (!rows.length) return [];
  const tiers = await db
    .select({ eventId: ticketTiers.eventId, price: ticketTiers.price, isActive: ticketTiers.isActive })
    .from(ticketTiers)
    .where(inArray(ticketTiers.eventId, rows.map((r) => r.id)));

  return rows.map((r) => ({ ...r, fromPrice: fromPrice(tiers.filter((t) => t.eventId === r.id)) }));
}

export type EventListRow = Awaited<ReturnType<typeof _listEvents>>[number];

async function _getEvent(slug: string) {
  const [ev] = await db
    .select()
    .from(ticketedEvents)
    .where(and(eq(ticketedEvents.slug, slug), eq(ticketedEvents.isActive, true)))
    .limit(1);
  if (!ev) return null;
  const tiers = await db
    .select()
    .from(ticketTiers)
    .where(eq(ticketTiers.eventId, ev.id))
    .orderBy(asc(ticketTiers.sortOrder), asc(ticketTiers.price));
  return { ...ev, tiers };
}

export type EventDetail = NonNullable<Awaited<ReturnType<typeof _getEvent>>>;

/** Tickets held per tier and day (live, never cached). Keys are `${tierId}|${day}`. */
async function _tierSold(eventId: string, holdHours = 3) {
  const rows = await db
    .select({
      tierId: ticketOrders.tierId,
      day: ticketOrders.day,
      sold: sql<number>`coalesce(sum(${ticketOrders.quantity}), 0)`.mapWith(Number),
    })
    .from(ticketOrders)
    .where(and(eq(ticketOrders.eventId, eventId), holdingClause(holdHours)))
    .groupBy(ticketOrders.tierId, ticketOrders.day);
  const out: Record<string, number> = {};
  for (const r of rows) if (r.tierId) out[`${r.tierId}|${r.day ?? ""}`] = r.sold;
  return out;
}

const orderCols = {
  id: ticketOrders.id,
  code: ticketOrders.code,
  status: ticketOrders.status,
  mode: ticketOrders.mode,
  userId: ticketOrders.userId,
  day: ticketOrders.day,
  tierName: ticketOrders.tierName,
  quantity: ticketOrders.quantity,
  admits: ticketOrders.admits,
  unitPrice: ticketOrders.unitPrice,
  amount: ticketOrders.amount,
  name: ticketOrders.name,
  phone: ticketOrders.phone,
  email: ticketOrders.email,
  utr: ticketOrders.utr,
  note: ticketOrders.note,
  adminNote: ticketOrders.adminNote,
  whatsappAt: ticketOrders.whatsappAt,
  confirmedAt: ticketOrders.confirmedAt,
  checkedInAt: ticketOrders.checkedInAt,
  createdAt: ticketOrders.createdAt,
  eventId: ticketedEvents.id,
  eventSlug: ticketedEvents.slug,
  eventTitle: ticketedEvents.title,
  category: ticketedEvents.category,
  citySlug: ticketedEvents.citySlug,
  venueName: ticketedEvents.venueName,
  area: ticketedEvents.area,
  address: ticketedEvents.address,
  mapUrl: ticketedEvents.mapUrl,
  startsAt: ticketedEvents.startsAt,
  timeLabel: ticketedEvents.timeLabel,
  poster: ticketedEvents.poster,
  dressCode: ticketedEvents.dressCode,
  ageLimit: ticketedEvents.ageLimit,
  bookingMode: ticketedEvents.bookingMode,
};

async function _getOrder(code: string) {
  const [row] = await db
    .select(orderCols)
    .from(ticketOrders)
    .innerJoin(ticketedEvents, eq(ticketOrders.eventId, ticketedEvents.id))
    .where(eq(ticketOrders.code, code))
    .limit(1);
  return row ?? null;
}

export type OrderView = NonNullable<Awaited<ReturnType<typeof _getOrder>>>;

async function _userOrders(userId: string) {
  return db
    .select(orderCols)
    .from(ticketOrders)
    .innerJoin(ticketedEvents, eq(ticketOrders.eventId, ticketedEvents.id))
    .where(eq(ticketOrders.userId, userId))
    .orderBy(desc(ticketOrders.createdAt))
    .limit(50);
}

/* ── admin reads ───────────────────────────────────────── */

async function _adminEvents() {
  const rows = await db.select().from(ticketedEvents).orderBy(asc(ticketedEvents.startsAt)).limit(300);
  if (!rows.length) return [];
  const [tiers, counts] = await Promise.all([
    db
      .select()
      .from(ticketTiers)
      .where(inArray(ticketTiers.eventId, rows.map((r) => r.id)))
      .orderBy(asc(ticketTiers.sortOrder), asc(ticketTiers.price)),
    db
      .select({
        eventId: ticketOrders.eventId,
        orders: sql<number>`count(*)`.mapWith(Number),
        confirmed: sql<number>`count(*) filter (where ${ticketOrders.status} in ('confirmed','checked_in'))`.mapWith(Number),
        toVerify: sql<number>`count(*) filter (where ${ticketOrders.status} = 'payment_submitted')`.mapWith(Number),
      })
      .from(ticketOrders)
      .groupBy(ticketOrders.eventId),
  ]);
  return rows.map((r) => ({
    ...r,
    tiers: tiers.filter((t) => t.eventId === r.id),
    stats: counts.find((c) => c.eventId === r.id) ?? { orders: 0, confirmed: 0, toVerify: 0 },
  }));
}

async function _adminOrders(opts: { status?: string; eventId?: string; limit?: number; q?: string } = {}) {
  const term = opts.q?.trim() ? `%${opts.q!.trim().replace(/[\\%_]/g, (c: string) => "\\" + c)}%` : null;
  return db
    .select({ ...orderCols, accountName: users.name })
    .from(ticketOrders)
    .innerJoin(ticketedEvents, eq(ticketOrders.eventId, ticketedEvents.id))
    .leftJoin(users, eq(ticketOrders.userId, users.id))
    .where(
      and(
        opts.status && opts.status !== "all" ? eq(ticketOrders.status, opts.status as OrderStatus) : undefined,
        opts.eventId ? eq(ticketOrders.eventId, opts.eventId) : undefined,
        term
          ? or(ilike(ticketOrders.name, term), ilike(ticketOrders.phone, term), ilike(ticketOrders.code, term), ilike(ticketOrders.email, term), ilike(ticketOrders.utr, term))
          : undefined
      )
    )
    .orderBy(desc(ticketOrders.createdAt))
    .limit(opts.limit ?? 300);
}

/* ── exports: reads fail soft ─────────────────────────── */

export const listEvents = safe(_listEvents, [] as EventListRow[]);
export const getEvent = safe(_getEvent, null);
export const tierSold = safe(_tierSold, {} as Record<string, number>);
export const getOrder = safe(_getOrder, null);
export const userOrders = safe(_userOrders, []);
export const adminEvents = safe(_adminEvents, []);
export const adminOrders = safe(_adminOrders, []);

export const rawEvents = { listEvents: _listEvents, getEvent: _getEvent };

/** Strict versions for write paths, where a failed read must not look like "nothing". */
export const strict = { tierSold: _tierSold, getOrder: _getOrder };

/** People with a confirmed or paid booking — real social proof for the event page. */
async function _goingCount(eventId: string) {
  const [r] = await db
    .select({ n: sql<number>`coalesce(sum(${ticketOrders.admits}), 0)`.mapWith(Number) })
    .from(ticketOrders)
    .where(and(eq(ticketOrders.eventId, eventId), inArray(ticketOrders.status, ["payment_submitted", "confirmed", "checked_in"])));
  return r?.n ?? 0;
}
export const goingCount = safe(_goingCount, 0);

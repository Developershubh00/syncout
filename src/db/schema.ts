import {
  pgTable, text, uuid, timestamp, integer, boolean, jsonb,
  pgEnum, real, uniqueIndex, index,
} from "drizzle-orm/pg-core";

/* ── enums ─────────────────────────────────────────────── */

export const entryTypeEnum = pgEnum("entry_type", [
  "stag_female",
  "couple",
  "stag_male",
  "group",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "waitlisted",
  "checked_in",
  "no_show",
  "cancelled",
]);

export const genderEnum = pgEnum("gender", ["female", "male", "other"]);

/* ── cities ────────────────────────────────────────────── */

export const cities = pgTable("cities", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  state: text("state"),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

/* ── users ─────────────────────────────────────────────── */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    gender: genderEnum("gender"),
    dob: text("dob"),
    citySlug: text("city_slug").default("new-delhi"),
    instagram: text("instagram"),
    avatarUrl: text("avatar_url"),
    idProofUrl: text("id_proof_url"),
    isVerified: boolean("is_verified").default(false).notNull(),
    isBlocked: boolean("is_blocked").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ emailIdx: uniqueIndex("users_email_idx").on(t.email) })
);

/* ── clubs / venues ────────────────────────────────────── */

export const clubs = pgTable(
  "clubs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    citySlug: text("city_slug").notNull().default("new-delhi"),
    area: text("area").notNull(),
    address: text("address"),
    tagline: text("tagline"),
    description: text("description"),
    coverImage: text("cover_image"),
    gallery: jsonb("gallery").$type<string[]>().default([]).notNull(),
    musicTypes: jsonb("music_types").$type<string[]>().default([]).notNull(),
    tags: jsonb("tags").$type<string[]>().default([]).notNull(),
    priceForTwo: integer("price_for_two"),
    openTime: text("open_time").default("8:00 PM"),
    closeTime: text("close_time").default("1:00 AM"),
    dressCode: text("dress_code").default("Smart casuals. No shorts, no slippers."),
    phone: text("phone"),
    mapUrl: text("map_url"),
    rating: real("rating").default(4.5),
    reviewCount: integer("review_count").default(0).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ cityIdx: index("clubs_city_idx").on(t.citySlug) })
);

/* ── events / nights ───────────────────────────────────── */

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    poster: text("poster"),
    gallery: jsonb("gallery").$type<string[]>().default([]).notNull(),
    artist: text("artist"),
    musicType: text("music_type"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),

    // guestlist
    guestlistOpen: boolean("guestlist_open").default(true).notNull(),
    cutoffHour: integer("cutoff_hour").default(18).notNull(), // 6 PM IST

    // per entry-type config
    femaleEnabled: boolean("female_enabled").default(true).notNull(),
    femaleLimit: integer("female_limit").default(40).notNull(),
    femalePrice: integer("female_price").default(0).notNull(),

    coupleEnabled: boolean("couple_enabled").default(true).notNull(),
    coupleLimit: integer("couple_limit").default(30).notNull(),
    couplePrice: integer("couple_price").default(0).notNull(),

    maleEnabled: boolean("male_enabled").default(true).notNull(),
    maleLimit: integer("male_limit").default(15).notNull(),
    malePrice: integer("male_price").default(0).notNull(),

    perks: jsonb("perks").$type<string[]>().default([]).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    clubIdx: index("events_club_idx").on(t.clubId),
    startsIdx: index("events_starts_idx").on(t.startsAt),
  })
);

/* ── bookings (guestlist entries) ──────────────────────── */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }).notNull(),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),

    entryType: entryTypeEnum("entry_type").notNull(),
    femaleCount: integer("female_count").default(0).notNull(),
    maleCount: integer("male_count").default(0).notNull(),
    totalGuests: integer("total_guests").default(1).notNull(),

    guestName: text("guest_name").notNull(),
    guestPhone: text("guest_phone").notNull(),
    guestEmail: text("guest_email").notNull(),
    guestInstagram: text("guest_instagram"),
    arrivalTime: text("arrival_time").default("9:30 PM"),
    notes: text("notes"),
    companions: jsonb("companions").$type<{ name: string; gender: string }[]>().default([]).notNull(),
    idProofUrl: text("id_proof_url"),

    status: bookingStatusEnum("status").default("pending").notNull(),
    amount: integer("amount").default(0).notNull(),
    rejectionReason: text("rejection_reason"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    emailSentAt: timestamp("email_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    eventIdx: index("bookings_event_idx").on(t.eventId),
    userIdx: index("bookings_user_idx").on(t.userId),
    statusIdx: index("bookings_status_idx").on(t.status),
  })
);

/* ── offers ────────────────────────────────────────────── */

export const offers = pgTable("offers", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  description: text("description"),
  image: text("image"),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }),
  validTill: timestamp("valid_till", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

/* ── reviews ───────────────────────────────────────────── */

export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
  authorName: text("author_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── favourites ────────────────────────────────────────── */

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    clubId: uuid("club_id").references(() => clubs.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ uniq: uniqueIndex("fav_user_club_idx").on(t.userId, t.clubId) })
);

export type Club = typeof clubs.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Offer = typeof offers.$inferSelect;

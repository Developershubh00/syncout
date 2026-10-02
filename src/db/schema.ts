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

/* ════════════════════════════════════════════════════════════════
   v6 — ticketed events, announcements, notifications, settings.

   New things use text columns (validated in code) rather than pg enums,
   so later patches can add a value without an ALTER TYPE migration.
   ════════════════════════════════════════════════════════════════ */

export type BookingMode = "upi" | "whatsapp" | "external" | "free";
export type OrderStatus =
  | "awaiting_payment"
  | "payment_submitted"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "refunded"
  | "checked_in";

/* ── ticketed events (Dandiya, concerts, festivals…) ────── */

export const ticketedEvents = pgTable(
  "ticketed_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: text("category").notNull().default("dandiya"),
    citySlug: text("city_slug").notNull().default("new-delhi"),
    venueName: text("venue_name").notNull(),
    area: text("area"),
    address: text("address"),
    mapUrl: text("map_url"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    /** IST calendar days the event runs (YYYY-MM-DD). Empty = the day of startsAt. */
    days: jsonb("days").$type<string[]>().default([]).notNull(),
    /** Shown instead of a clock time, e.g. "Multiple slots". */
    timeLabel: text("time_label"),
    poster: text("poster"),
    gallery: jsonb("gallery").$type<string[]>().default([]).notNull(),
    description: text("description"),
    highlights: jsonb("highlights").$type<string[]>().default([]).notNull(),
    organizer: text("organizer"),
    ageLimit: text("age_limit"),
    dressCode: text("dress_code"),
    terms: text("terms"),
    bookingMode: text("booking_mode").$type<BookingMode>().default("upi").notNull(),
    externalUrl: text("external_url"),
    /** Where the listing came from — admin reference only, never shown. */
    sourceUrl: text("source_url"),
    salesOpen: boolean("sales_open").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    cityIdx: index("tev_city_idx").on(t.citySlug),
    startsIdx: index("tev_starts_idx").on(t.startsAt),
  })
);

export const ticketTiers = pgTable(
  "ticket_tiers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .references(() => ticketedEvents.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    price: integer("price").default(0).notNull(),
    /** People one ticket lets in — 2 for a couple pass. */
    admits: integer("admits").default(1).notNull(),
    /** Tickets available. Null = no cap. */
    capacity: integer("capacity"),
    perOrderMax: integer("per_order_max").default(10).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (t) => ({ eventIdx: index("tiers_event_idx").on(t.eventId) })
);

export const ticketOrders = pgTable(
  "ticket_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull().unique(),
    eventId: uuid("event_id")
      .references(() => ticketedEvents.id, { onDelete: "cascade" })
      .notNull(),
    tierId: uuid("tier_id").references(() => ticketTiers.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    day: text("day"),
    tierName: text("tier_name").default("").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    admits: integer("admits").default(1).notNull(),
    unitPrice: integer("unit_price").default(0).notNull(),
    amount: integer("amount").default(0).notNull(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    status: text("status").$type<OrderStatus>().default("awaiting_payment").notNull(),
    mode: text("mode").$type<BookingMode>().default("upi").notNull(),
    utr: text("utr"),
    note: text("note"),
    adminNote: text("admin_note"),
    whatsappAt: timestamp("whatsapp_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    eventIdx: index("orders_event_idx").on(t.eventId),
    userIdx: index("orders_user_idx").on(t.userId),
    statusIdx: index("orders_status_idx").on(t.status),
  })
);

/* ── announcements (popups / banners managed in admin) ──── */

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Stable key for seeded announcements so the seeder stays idempotent. */
  slug: text("slug").unique(),
  title: text("title").notNull(),
  body: text("body"),
  image: text("image"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  kind: text("kind").$type<"popup" | "banner">().default("popup").notNull(),
  audience: text("audience").$type<"everyone" | "signed_in" | "signed_out">().default("everyone").notNull(),
  theme: text("theme").$type<"festive" | "elegant">().default("festive").notNull(),
  /** City links shown as chips in the popup, e.g. ["new-delhi","gurugram","noida"]. */
  cities: jsonb("cities").$type<string[]>().default([]).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  priority: integer("priority").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ── in-app notifications + web push ─────────────────────── */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: text("kind").default("info").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    url: text("url"),
    /** false = goes to the bell quietly, no popup. */
    popup: boolean("popup").default(true).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("notif_user_idx").on(t.userId, t.createdAt) })
);

export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("push_user_idx").on(t.userId) })
);

/* ── key/value settings edited in Admin → Settings ───────── */

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/* ════════════════════════════════════════════════════════════════
   v6.3 — accounts, contact inbox, careers.
   ════════════════════════════════════════════════════════════════ */

export const passwordResets = pgTable(
  "password_resets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    /** sha256 of the token — the token itself is only ever in the link. */
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ userIdx: index("resets_user_idx").on(t.userId) })
);

export const inquiries = pgTable(
  "inquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** general | booking | partner | press | careers | volunteer */
    kind: text("kind").default("general").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    message: text("message").notNull(),
    /** new | handled */
    status: text("status").default("new").notNull(),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ statusIdx: index("inquiries_status_idx").on(t.status) })
);

export const jobOpenings = pgTable("job_openings", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  team: text("team"),
  /** full_time | part_time | internship | volunteer | contract */
  type: text("type").default("full_time").notNull(),
  location: text("location").default("Delhi NCR").notNull(),
  /** onsite | hybrid | remote */
  workMode: text("work_mode").default("hybrid").notNull(),
  summary: text("summary"),
  responsibilities: jsonb("responsibilities").$type<string[]>().default([]).notNull(),
  requirements: jsonb("requirements").$type<string[]>().default([]).notNull(),
  perks: jsonb("perks").$type<string[]>().default([]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobApplications = pgTable(
  "job_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    openingId: uuid("opening_id").references(() => jobOpenings.id, { onDelete: "set null" }),
    roleTitle: text("role_title").notNull(),
    /** job | internship | volunteer */
    kind: text("kind").default("job").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    city: text("city"),
    /** LinkedIn, portfolio or a resume link (Drive/Dropbox). */
    link: text("link"),
    message: text("message"),
    /** new | shortlisted | rejected | hired */
    status: text("status").default("new").notNull(),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({ statusIdx: index("applications_status_idx").on(t.status) })
);

export type JobOpening = typeof jobOpenings.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;

export type TicketedEvent = typeof ticketedEvents.$inferSelect;
export type TicketTier = typeof ticketTiers.$inferSelect;
export type TicketOrder = typeof ticketOrders.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Notification = typeof notifications.$inferSelect;

export type Club = typeof clubs.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type User = typeof users.$inferSelect;
export type Offer = typeof offers.$inferSelect;

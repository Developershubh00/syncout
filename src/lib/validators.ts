import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Tell us your name").max(60),
  email: z.string().email("That email doesn't look right"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  password: z.string().min(6, "Use at least 6 characters"),
  gender: z.enum(["female", "male", "other"]),
  citySlug: z.string().default("new-delhi"),
  instagram: z.string().max(40).optional().or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const bookingSchema = z.object({
  eventId: z.string().uuid(),
  entryType: z.enum(["stag_female", "couple", "stag_male", "group"]),
  femaleCount: z.number().int().min(0).max(10),
  maleCount: z.number().int().min(0).max(10),
  guestName: z.string().min(2).max(60),
  guestPhone: z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  guestEmail: z.string().email(),
  guestInstagram: z.string().max(40).optional().or(z.literal("")),
  arrivalTime: z.string().max(20).default("9:30 PM"),
  notes: z.string().max(300).optional().or(z.literal("")),
  companions: z
    .array(z.object({ name: z.string().max(60), gender: z.string().max(10) }))
    .max(10)
    .default([]),
});

export const adminLoginSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  authKey: z.string().optional(),
});

export const clubSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  citySlug: z.string().min(2),
  area: z.string().min(2),
  address: z.string().optional().nullable(),
  tagline: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  gallery: z.array(z.string()).default([]),
  musicTypes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  priceForTwo: z.number().int().optional().nullable(),
  openTime: z.string().optional().nullable(),
  closeTime: z.string().optional().nullable(),
  dressCode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  mapUrl: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const eventSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional().nullable(),
  poster: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  musicType: z.string().optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string().optional().nullable(),
  guestlistOpen: z.boolean().default(true),
  cutoffHour: z.number().int().min(0).max(23).default(18),
  femaleEnabled: z.boolean().default(true),
  femaleLimit: z.number().int().min(0).default(40),
  femalePrice: z.number().int().min(0).default(0),
  coupleEnabled: z.boolean().default(true),
  coupleLimit: z.number().int().min(0).default(30),
  couplePrice: z.number().int().min(0).default(0),
  maleEnabled: z.boolean().default(true),
  maleLimit: z.number().int().min(0).default(15),
  malePrice: z.number().int().min(0).default(0),
  perks: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

/* ── v6 ─────────────────────────────────────────────────────── */

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number");
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date");
const optUrl = z.string().max(2000).optional().nullable();

export const adminBookingPatchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "waitlisted", "checked_in", "no_show", "cancelled"]),
  reason: z.string().max(200).optional().nullable(),
});

export const tierSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1, "Every ticket type needs a name").max(60),
  description: z.string().max(200).optional().nullable(),
  price: z.number().int().min(0).max(1_000_000),
  admits: z.number().int().min(1).max(20).default(1),
  capacity: z.number().int().min(0).max(100_000).optional().nullable(),
  perOrderMax: z.number().int().min(1).max(50).default(10),
  isActive: z.boolean().default(true),
  compareAtPrice: z.number().int().min(0).max(1_000_000).optional().nullable(),
  salesStartAt: z.string().datetime({ offset: true }).optional().nullable(),
  salesEndAt: z.string().datetime({ offset: true }).optional().nullable(),
  badge: z.string().trim().max(24).optional().nullable(),
});

export const ticketedEventSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(30).default("dandiya"),
  citySlug: z.string().trim().min(2).max(40),
  venueName: z.string().trim().min(2).max(120),
  area: z.string().max(80).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  mapUrl: optUrl,
  startsAt: z.string().min(10),
  endsAt: z.string().optional().nullable(),
  days: z.array(day).max(31).default([]),
  timeLabel: z.string().max(40).optional().nullable(),
  poster: optUrl,
  gallery: z.array(z.string().max(2000)).max(12).default([]),
  description: z.string().max(4000).optional().nullable(),
  highlights: z.array(z.string().max(120)).max(12).default([]),
  organizer: z.string().max(120).optional().nullable(),
  ageLimit: z.string().max(40).optional().nullable(),
  dressCode: z.string().max(200).optional().nullable(),
  terms: z.string().max(4000).optional().nullable(),
  bookingMode: z.enum(["upi", "whatsapp", "external", "free"]).default("upi"),
  externalUrl: optUrl,
  sourceUrl: optUrl,
  salesOpen: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  tiers: z.array(tierSchema).max(12).default([]),
});

export const orderSchema = z.object({
  eventId: z.string().uuid(),
  tierId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
  day: day.optional().nullable(),
  name: z.string().trim().min(2, "Tell us your name").max(60),
  phone,
  email: z.string().trim().email("That email doesn't look right").max(120),
  note: z.string().max(300).optional().or(z.literal("")),
  promoCode: z.string().trim().max(30).optional().or(z.literal("")),
});

export const orderPaidSchema = z.object({
  utr: z.string().trim().max(40).optional().or(z.literal("")),
  k: z.string().max(64).optional().nullable(),
  /** WhatsApp-mode bookings: record that they messaged us, without marking it paid. */
  enquiry: z.boolean().optional(),
});

export const adminOrderPatchSchema = z.object({
  status: z.enum(["awaiting_payment", "payment_submitted", "confirmed", "rejected", "cancelled", "refunded", "checked_in"]).optional(),
  adminNote: z.string().max(300).optional().nullable(),
  reason: z.string().max(200).optional().nullable(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().max(600).optional().nullable(),
  image: optUrl,
  ctaLabel: z.string().max(40).optional().nullable(),
  ctaUrl: optUrl,
  kind: z.enum(["popup", "banner"]).default("popup"),
  audience: z.enum(["everyone", "signed_in", "signed_out"]).default("everyone"),
  theme: z.enum(["festive", "elegant"]).default("festive"),
  cities: z.array(z.string().max(40)).max(10).default([]),
  startsAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  priority: z.number().int().min(-100).max(100).default(0),
});

export const offerSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().max(80).optional().nullable(),
  description: z.string().max(400).optional().nullable(),
  image: optUrl,
  clubId: z.string().uuid().optional().nullable(),
  validTill: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const homeSectionSchema = z.object({
  key: z.enum(["events", "aroundTown", "hotspots", "onTheHouse", "howItWorks", "moreClubs"]),
  visible: z.boolean(),
  title: z.string().max(80),
  sub: z.string().max(120),
});

export const settingsSchema = z.object({
  upiVpa: z
    .string()
    .trim()
    .max(80)
    .refine((v) => !v || /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,64}$/.test(v), "UPI ID should look like name@bank"),
  payeeName: z.string().trim().max(60),
  upiQrImage: z.string().max(2000),
  whatsapp: z
    .string()
    .trim()
    .max(20)
    .refine((v) => /^\d{10,15}$/.test(v.replace(/\D/g, "")), "WhatsApp number needs 10–15 digits"),
  orderHoldHours: z.number().int().min(1).max(72),
  installPrompt: z.boolean(),
  whatsappFab: z.boolean(),
  homeSections: z.array(homeSectionSchema).max(10),
  businessName: z.string().trim().max(80),
  legalName: z.string().trim().max(120),
  businessAddress: z.string().trim().max(300),
  supportEmail: z.string().trim().max(120),
  supportPhone: z.string().trim().max(20),
  grievanceOfficer: z.string().trim().max(80),
  grievanceEmail: z.string().trim().max(120),
  instagram: z.string().trim().max(40),
  noBookingFee: z.boolean(),
  gaId: z.string().trim().max(40),
  metaPixelId: z.string().trim().max(40),
  adsId: z.string().trim().max(40),
  adsLabel: z.string().trim().max(80),
});

export const notifySchema = z.object({
  audience: z.enum(["night", "event", "all_users"]),
  targetId: z.string().uuid().optional().nullable(),
  statuses: z.array(z.string().max(30)).max(10).default([]),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().max(600).default(""),
  url: z.string().max(500).optional().nullable(),
  channels: z.object({ inApp: z.boolean(), email: z.boolean() }),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().max(200), auth: z.string().max(100) }),
});

/* ── v6.3 ───────────────────────────────────────────────────── */

const optPhone = z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number").optional().or(z.literal(""));

export const inquirySchema = z
  .object({
    kind: z.enum(["general", "booking", "partner", "press", "careers", "volunteer"]).default("general"),
    name: z.string().trim().min(2, "Tell us your name").max(80),
    email: z.string().trim().email("That email doesn't look right").max(120).optional().or(z.literal("")),
    phone: optPhone,
    message: z.string().trim().min(10, "A little more detail, please").max(2000),
    website: z.string().max(0).optional(), // honeypot: real people leave it empty
  })
  .refine((d) => Boolean(d.email || d.phone), { message: "Add an email or a phone number so we can reply", path: ["email"] });

export const applicationSchema = z.object({
  openingId: z.string().uuid().optional().nullable(),
  roleTitle: z.string().trim().min(2).max(120),
  kind: z.enum(["job", "internship", "volunteer"]).default("job"),
  name: z.string().trim().min(2, "Tell us your name").max(80),
  email: z.string().trim().email("That email doesn't look right").max(120),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  city: z.string().trim().max(60).optional().or(z.literal("")),
  link: z.string().trim().max(300).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  website: z.string().max(0).optional(),
});

export const openingSchema = z.object({
  slug: z.string().trim().min(2).max(80),
  title: z.string().trim().min(2).max(120),
  team: z.string().max(60).optional().nullable(),
  type: z.enum(["full_time", "part_time", "internship", "volunteer", "contract"]),
  location: z.string().trim().min(2).max(80),
  workMode: z.enum(["onsite", "hybrid", "remote"]),
  summary: z.string().max(600).optional().nullable(),
  responsibilities: z.array(z.string().max(200)).max(15).default([]),
  requirements: z.array(z.string().max(200)).max(15).default([]),
  perks: z.array(z.string().max(120)).max(10).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name").max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  instagram: z.string().trim().max(40).optional().or(z.literal("")),
  citySlug: z.string().trim().max(40),
  gender: z.enum(["female", "male", "other"]).optional().nullable(),
});

export const passwordChangeSchema = z.object({
  /** Not needed the first time, for accounts made at checkout. */
  current: z.string().optional(),
  next: z.string().min(6, "Use at least 6 characters").max(100),
});

export const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(6, "Use at least 6 characters").max(100),
});

/* ── v6.4 ───────────────────────────────────────────────────── */

export const promoBaseSchema = z.object({
  code: z.string().trim().min(3, "At least 3 characters").max(30).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  label: z.string().trim().max(80).optional().nullable(),
  kind: z.enum(["percent", "flat"]),
  value: z.number().int().min(1).max(100_000),
  maxDiscount: z.number().int().min(1).max(100_000).optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
  minQuantity: z.number().int().min(1).max(50).default(1),
  maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
  startsAt: z.string().datetime({ offset: true }).optional().nullable(),
  endsAt: z.string().datetime({ offset: true }).optional().nullable(),
  isActive: z.boolean().default(true),
});
export const promoSchema = promoBaseSchema.refine((p) => p.kind !== "percent" || p.value <= 100, {
  message: "A percent code can't be more than 100%",
  path: ["value"],
});

export const waitlistSchema = z.object({
  eventId: z.string().uuid(),
  tierId: z.string().uuid().optional().nullable(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  name: z.string().trim().min(2, "Tell us your name").max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  quantity: z.number().int().min(1).max(20).default(1),
});

export const staffSchema = z.object({
  name: z.string().trim().min(2).max(60),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4–8 digits").optional(),
  isActive: z.boolean().optional(),
});

export const staffLoginSchema = z.object({
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter your 10-digit mobile number"),
  pin: z.string().regex(/^\d{4,8}$/, "Enter your PIN"),
});

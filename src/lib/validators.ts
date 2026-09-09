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
  arrivalTime: z.string().default("9:30 PM"),
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
  femaleLimit: z.number().int().default(40),
  femalePrice: z.number().int().default(0),
  coupleEnabled: z.boolean().default(true),
  coupleLimit: z.number().int().default(30),
  couplePrice: z.number().int().default(0),
  maleEnabled: z.boolean().default(true),
  maleLimit: z.number().int().default(15),
  malePrice: z.number().int().default(0),
  perks: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

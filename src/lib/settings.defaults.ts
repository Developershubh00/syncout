/** Settings types and defaults — importable from scripts (no server-only). */
import { SITE } from "./site";

export type HomeSectionKey = "events" | "aroundTown" | "hotspots" | "onTheHouse" | "howItWorks" | "moreClubs";
export type HomeSection = { key: HomeSectionKey; visible: boolean; title: string; sub: string };

export type SiteSettings = {
  /** UPI ID that receives event payments, e.g. syncout@okicici. Empty = take bookings over WhatsApp. */
  upiVpa: string;
  payeeName: string;
  /** Optional uploaded merchant QR, used when there's no UPI ID. */
  upiQrImage: string;
  /** Country code + number. Bookings and payment proofs go here. */
  whatsapp: string;
  /** Unpaid event orders hold their tickets this long. */
  orderHoldHours: number;
  installPrompt: boolean;
  whatsappFab: boolean;
  homeSections: HomeSection[];
  /** Shown on the legal and contact pages. */
  businessName: string;
  legalName: string;
  businessAddress: string;
  supportEmail: string;
  supportPhone: string;
  grievanceOfficer: string;
  grievanceEmail: string;
  instagram: string;
  /** Shows a "No booking fee" badge at checkout — only switch on if it's true. */
  noBookingFee: boolean;
  /** Ads & analytics. Leave blank to switch off. */
  gaId: string;
  metaPixelId: string;
  adsId: string;
  adsLabel: string;
};

export const HOME_SECTION_DEFAULTS: HomeSection[] = [
  { key: "events", visible: true, title: "Dandiya Nights 2026", sub: "Navratri 11–19 Oct · Delhi, Gurugram & Noida" },
  { key: "aroundTown", visible: true, title: "Around town", sub: "" },
  { key: "hotspots", visible: true, title: "Hotspots", sub: "Where the city actually goes" },
  { key: "onTheHouse", visible: true, title: "On the house", sub: "What being approved gets you" },
  { key: "howItWorks", visible: true, title: "How the list works", sub: "" },
  { key: "moreClubs", visible: true, title: "More clubs", sub: "" },
];

export const DEFAULT_SETTINGS: SiteSettings = {
  upiVpa: "",
  payeeName: "SyncOut",
  upiQrImage: "",
  whatsapp: SITE.whatsapp,
  orderHoldHours: 3,
  installPrompt: true,
  whatsappFab: true,
  homeSections: HOME_SECTION_DEFAULTS,
  businessName: "SyncOut",
  legalName: "",
  businessAddress: "",
  supportEmail: "hello@syncout.in",
  supportPhone: "",
  grievanceOfficer: "",
  grievanceEmail: "",
  instagram: "",
  noBookingFee: false,
  gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "",
  adsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "",
  adsLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL ?? "",
};

const str = (v: unknown, d: string) => (typeof v === "string" ? v.trim() : d);
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);

/** Merge whatever is stored over the defaults, so new settings never come back undefined. */
export function normalizeSettings(raw: unknown): SiteSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const d = DEFAULT_SETTINGS;

  const stored = Array.isArray(r.homeSections) ? (r.homeSections as Partial<HomeSection>[]) : [];
  const known = new Map(HOME_SECTION_DEFAULTS.map((s) => [s.key, s]));
  const sections: HomeSection[] = [];
  for (const s of stored) {
    const base = s && s.key ? known.get(s.key as HomeSectionKey) : undefined;
    if (!base || sections.some((x) => x.key === base.key)) continue;
    sections.push({
      key: base.key,
      visible: bool(s.visible, base.visible),
      title: str(s.title, base.title) || base.title,
      sub: str(s.sub, base.sub),
    });
  }
  for (const s of HOME_SECTION_DEFAULTS) if (!sections.some((x) => x.key === s.key)) sections.push(s);

  const hours = Number(r.orderHoldHours);
  return {
    upiVpa: str(r.upiVpa, d.upiVpa),
    payeeName: str(r.payeeName, d.payeeName) || d.payeeName,
    upiQrImage: str(r.upiQrImage, d.upiQrImage),
    whatsapp: str(r.whatsapp, d.whatsapp).replace(/\D/g, "") || d.whatsapp,
    orderHoldHours: Number.isFinite(hours) && hours >= 1 && hours <= 72 ? Math.round(hours) : d.orderHoldHours,
    installPrompt: bool(r.installPrompt, d.installPrompt),
    whatsappFab: bool(r.whatsappFab, d.whatsappFab),
    homeSections: sections,
    businessName: str(r.businessName, d.businessName) || d.businessName,
    legalName: str(r.legalName, d.legalName),
    businessAddress: str(r.businessAddress, d.businessAddress),
    supportEmail: str(r.supportEmail, d.supportEmail),
    supportPhone: str(r.supportPhone, d.supportPhone),
    grievanceOfficer: str(r.grievanceOfficer, d.grievanceOfficer),
    grievanceEmail: str(r.grievanceEmail, d.grievanceEmail),
    instagram: str(r.instagram, d.instagram).replace(/^@/, ""),
    noBookingFee: bool(r.noBookingFee, d.noBookingFee),
    gaId: str(r.gaId, d.gaId),
    metaPixelId: str(r.metaPixelId, d.metaPixelId),
    adsId: str(r.adsId, d.adsId),
    adsLabel: str(r.adsLabel, d.adsLabel),
  };
}


/**
 * Dandiya & Garba nights for Navratri 2026 (11–19 Oct, Dussehra 20 Oct) in
 * Delhi, Gurugram and Noida.
 *
 * Titles, venues, dates, start times and starting prices are from the public
 * listings in `sourceUrl` (checked 2 Oct 2026). Descriptions are our own.
 * Prices are the organisers' "from" price — set your own in Admin → Events,
 * and only sell an event over UPI if you actually hold passes for it.
 * Posters are original artwork in /public/events — swap in official posters
 * you have rights to from the admin panel.
 */
export type SeedTicketEvent = {
  slug: string;
  title: string;
  category: "dandiya" | "garba";
  citySlug: "new-delhi" | "gurugram" | "noida";
  venueName: string;
  area?: string;
  address?: string;
  days: string[];
  /** 24h IST start time. */
  time: string;
  timeLabel?: string;
  hours: number;
  description: string;
  highlights: string[];
  ageLimit?: string;
  terms?: string;
  isFeatured?: boolean;
  sourceUrl: string;
  tiers: { name: string; price: number; admits?: number; description?: string }[];
};

const D = "https://www.district.in/events/";
const NAV_TERMS =
  "Carry a government photo ID. Entry is at the organiser's discretion. Passes are non-transferable once checked in.";

export const DANDIYA_2026: SeedTicketEvent[] = [
  /* ── Delhi ─────────────────────────────────────────────── */
  {
    slug: "raatri-raaga-jln-stadium-2026",
    title: "Raatri Raaga — The Raas Affair",
    category: "dandiya",
    citySlug: "new-delhi",
    venueName: "Jawaharlal Nehru Stadium",
    area: "Lodhi Road",
    days: ["2026-10-16", "2026-10-17", "2026-10-18"],
    time: "16:00",
    hours: 6,
    description:
      "Three evenings of Dandiya Raas inside JLN Stadium, each with its own headline act — live bands, a bhajan-clubbing set and Bollywood DJs — plus food and flea stalls between rounds. Gates open at 4 PM.",
    highlights: ["Dandiya Raas", "Live bands", "Bhajan clubbing", "Bollywood DJ", "Food & flea stalls"],
    ageLimit: "3+",
    terms: "Veg food only, no alcohol on site. " + NAV_TERMS,
    isFeatured: true,
    sourceUrl: D + "raatri-raaga-the-raas-affair-2026-buy-tickets",
    tiers: [{ name: "Day pass", price: 999 }],
  },
  {
    slug: "rangtaali-2026-delhi",
    title: "Rangtaali 2026 — Garba & Dandiya Night",
    category: "garba",
    citySlug: "new-delhi",
    venueName: "Lalit Mahajan SVM Sr. Sec. School",
    days: ["2026-10-16", "2026-10-17", "2026-10-18"],
    time: "19:00",
    hours: 4,
    description:
      "A Garba and Dandiya night that leans traditional — big raas circles, festive dress and three evenings to choose from over Navratri's last weekend.",
    highlights: ["Traditional Garba", "Dandiya circles", "Festive dress"],
    terms: NAV_TERMS,
    sourceUrl: D + "rangtaali-2026-delhis-most-authentic-garba-utsav-oct16-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 570 }],
  },
  {
    slug: "bollywood-dandiya-night-psoi-chanakyapuri-2026",
    title: "Bollywood Dandiya Night",
    category: "dandiya",
    citySlug: "new-delhi",
    venueName: "PSOI Club",
    area: "Nehru Park, Chanakyapuri",
    days: ["2026-10-17", "2026-10-18"],
    time: "18:00",
    hours: 5,
    description:
      "Dandiya to Bollywood hits on the lawns of the PSOI Club in Chanakyapuri — a dressier, central-Delhi option for the Saturday and Sunday of Navratri.",
    highlights: ["Bollywood DJ", "Lawn setting", "Central Delhi"],
    terms: NAV_TERMS,
    sourceUrl: D + "bollywood-dandiya-night-oct17-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 885 }],
  },
  {
    slug: "garba-dazzle-season-3-dilli-haat-2026",
    title: "Garba Dazzle — Season 3",
    category: "garba",
    citySlug: "new-delhi",
    venueName: "Dilli Haat",
    area: "Pitampura",
    days: ["2026-10-11"],
    time: "16:00",
    hours: 5,
    description:
      "Start Navratri on day one at Dilli Haat Pitampura — an afternoon-into-evening Garba with stalls all around and an easy, family-friendly crowd.",
    highlights: ["Navratri day 1", "Open-air", "Food stalls"],
    terms: NAV_TERMS,
    sourceUrl: D + "garba-dazzle-season-3-dilli-haat-pitampura-oct11-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 299 }],
  },
  {
    slug: "meri-dilli-dandiya-utsav-2026",
    title: "Meri Dilli Dandiya Utsav",
    category: "dandiya",
    citySlug: "new-delhi",
    venueName: "Talkatora Indoor Stadium",
    area: "Talkatora Garden",
    days: ["2026-10-23", "2026-10-24", "2026-10-25"],
    time: "16:00",
    timeLabel: "Multiple slots",
    hours: 6,
    description:
      "Missed Navratri? This one runs the weekend after Dussehra, indoors at Talkatora Stadium, with several slots a day so you can pick your time.",
    highlights: ["After Dussehra", "Indoor", "Several slots a day"],
    terms: NAV_TERMS,
    sourceUrl: D + "meri-dilli-dandiya-utsav-oct23-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 700 }],
  },

  /* ── Gurugram ──────────────────────────────────────────── */
  {
    slug: "shubharambh-2026-dlf-cyberhub",
    title: "Shubharambh 2026 — Disco Dandiya Festival",
    category: "dandiya",
    citySlug: "gurugram",
    venueName: "DLF CyberHub",
    area: "DLF Cyber City",
    days: ["2026-10-17", "2026-10-18"],
    time: "16:00",
    hours: 6,
    description:
      "Disco-meets-Dandiya at CyberHub: dandiya sticks, a big sound system and the bars and restaurants of Cyber City steps away. Billed as Gurugram's biggest.",
    highlights: ["Disco Dandiya", "Cyber City", "Bars nearby"],
    terms: NAV_TERMS,
    isFeatured: true,
    sourceUrl: D + "shubharambh-gurugrams-biggest-disco-dandiya-festival-buy-tickets",
    tiers: [{ name: "Entry pass", price: 800 }],
  },
  {
    slug: "dandiya-raas-under-the-stars-gymkhana-2026",
    title: "Dandiya Raas — Under the Stars",
    category: "dandiya",
    citySlug: "gurugram",
    venueName: "Gymkhana Club",
    area: "Sector 29",
    days: ["2026-10-17"],
    time: "18:00",
    hours: 5,
    description:
      "An open-air Saturday of Dandiya Raas at the Gymkhana Club in Sector 29 — dress up, it's that kind of night.",
    highlights: ["Open-air", "Saturday night", "Sector 29"],
    terms: NAV_TERMS,
    sourceUrl: D + "dandiya-raas-under-the-stars-2026-oct17-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 899 }],
  },
  {
    slug: "garba-ni-raat-2-one7-sports-park-2026",
    title: "Garba Ni Raat 2.0",
    category: "garba",
    citySlug: "gurugram",
    venueName: "One7 Sports Park",
    area: "Baliawas, Ghata",
    address: "ONE7 Sports Park, Baliawas, Ghata, Gurugram, Haryana 122011",
    days: ["2026-10-17"],
    time: "17:30",
    hours: 7,
    description:
      "A long Saturday of Garba and Dandiya on the cricket ground at One7 Sports Park — space to dance properly, from early evening till late.",
    highlights: ["Huge open ground", "7 hours", "Garba + Dandiya"],
    terms: NAV_TERMS,
    sourceUrl: D + "garba-ni-raat-20-dandiya-night-2026-oct17-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 699 }],
  },
  {
    slug: "dandiya-night-molecule-ifc-gurgaon-2026",
    title: "Dandiya Nights at Molecule IFC",
    category: "dandiya",
    citySlug: "gurugram",
    venueName: "Molecule Air Bar",
    area: "M3M International Financial Center",
    days: ["2026-10-11", "2026-10-12", "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19"],
    time: "20:00",
    hours: 4,
    description:
      "All nine nights of Navratri at Molecule's IFC bar — Dandiya with a club crowd, a full bar and food, from 8 PM.",
    highlights: ["All 9 nights", "Bar & food", "Club crowd"],
    ageLimit: "21+",
    terms: NAV_TERMS,
    sourceUrl: D + "dandiya-night-at-molecule-ifc-gurgaon-oct11-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 299 }],
  },
  {
    slug: "bollywood-dandiya-raas-season-9-goa-country-club",
    title: "Biggest Bollywood Dandiya Raas — Season 9",
    category: "dandiya",
    citySlug: "gurugram",
    venueName: "Goa Country Club by Pearl",
    days: ["2026-10-17", "2026-10-18"],
    time: "19:00",
    hours: 4,
    description:
      "The ninth year of this Bollywood Dandiya Raas — a weekend of filmi beats and dandiya circles that's become a Gurugram Navratri regular.",
    highlights: ["Season 9", "Bollywood beats", "Weekend"],
    terms: NAV_TERMS,
    sourceUrl: D + "biggest-bollywood-dandiya-raas-season9-oct17-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 399 }],
  },

  /* ── Noida ─────────────────────────────────────────────── */
  {
    slug: "dandiya-dhamaal-2026-sapna-chaudhary-noida",
    title: "Dandiya Dhamaal 2026 ft. Sapna Chaudhary",
    category: "dandiya",
    citySlug: "noida",
    venueName: "India Expo Centre",
    area: "Sector 62",
    address: "A-11 Expo Drive, Sector 62, Noida, Uttar Pradesh",
    days: ["2026-10-16", "2026-10-17", "2026-10-18"],
    time: "17:00",
    hours: 6,
    description:
      "Noida's big-ticket Navratri weekend: three nights of Dandiya at India Expo Centre with Sapna Chaudhary performing live, outdoors with seating and a standing floor.",
    highlights: ["Live: Sapna Chaudhary", "3 nights", "Outdoor"],
    ageLimit: "5+",
    terms: NAV_TERMS,
    isFeatured: true,
    sourceUrl: D + "dandiya-dhamaal-2026-ft-sapna-chaudhary-oct16-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 499 }],
  },
  {
    slug: "great-indian-garba-fest-4-worlds-of-wonder",
    title: "The Great Indian Garba Fest 4.0",
    category: "garba",
    citySlug: "noida",
    venueName: "Worlds of Wonder",
    area: "Sector 38A",
    days: ["2026-10-16", "2026-10-17", "2026-10-18"],
    time: "17:00",
    hours: 6,
    description:
      "The fourth edition of this Garba festival takes over Worlds of Wonder for Navratri's final weekend — big crowds, big lights, plenty of room.",
    highlights: ["4th edition", "Final weekend", "Large venue"],
    terms: NAV_TERMS,
    isFeatured: true,
    sourceUrl: D + "the-great-indian-garba-fest-40-oct16-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 799 }],
  },
  {
    slug: "ikigai-dandiya-nights-2026-noida",
    title: "Ikigai Dandiya Nights 2026",
    category: "dandiya",
    citySlug: "noida",
    venueName: "Ikigai Farm",
    area: "Sector 134",
    address: "Bandh Rd, Sector 134, Nagla Nagli, Noida, Uttar Pradesh 201304",
    days: ["2026-10-17", "2026-10-18"],
    time: "19:00",
    hours: 3,
    description:
      "Dandiya on a farm off the Noida Expressway — a greener, roomier setting for the Navratri weekend, with snacks included on the adult passes.",
    highlights: ["Farm setting", "Snacks included", "Family friendly"],
    terms: NAV_TERMS,
    sourceUrl: D + "ikigai-dandiya-nights-2026-noida-oct17-2026-buy-tickets",
    tiers: [
      { name: "Single + snacks", price: 499 },
      { name: "Couple + snacks", price: 999, admits: 2 },
      { name: "Kids pass (no snacks)", price: 199 },
    ],
  },
  {
    slug: "dandiya-shubharambh-ministry-of-sound-noida",
    title: "Dandiya Shubharambh at Ministry of Sound",
    category: "dandiya",
    citySlug: "noida",
    venueName: "Ministry of Sound — Brewery",
    days: ["2026-10-11"],
    time: "19:00",
    hours: 4,
    description:
      "Open Navratri at Ministry of Sound's Noida brewery — a club-night take on Dandiya on day one.",
    highlights: ["Navratri day 1", "Brewery", "Club night"],
    ageLimit: "21+",
    terms: NAV_TERMS,
    sourceUrl: D + "-ministry-of-sound-presents-dandiya-shubharambh--oct11-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 299 }],
  },
  {
    slug: "dandiya-fest-2026-dlf-mall-of-india",
    title: "Dandiya Fest 2026",
    category: "dandiya",
    citySlug: "noida",
    venueName: "DLF Mall of India",
    area: "Sector 18",
    days: ["2026-10-16"],
    time: "19:00",
    hours: 4,
    description: "A Friday-night Dandiya at DLF Mall of India in Sector 18 — easy to reach by metro, easy to make a night of it.",
    highlights: ["Friday night", "Metro-friendly", "Sector 18"],
    terms: NAV_TERMS,
    sourceUrl: D + "dandiya-fest-2026-oct16-2026-buy-tickets",
    tiers: [{ name: "Entry pass", price: 707 }],
  },
];

export const DANDIYA_ANNOUNCEMENT = {
  slug: "dandiya-2026",
  title: "Dandiya Nights 2026 are here",
  body: "15 Navratri nights across Delhi, Gurugram & Noida. Pick your night and book your passes in a minute.",
  image: "/events/dandiya-popup.svg",
  ctaLabel: "See Dandiya nights",
  ctaUrl: "/dandiya",
  cities: ["new-delhi", "gurugram", "noida"],
  theme: "festive" as const,
  kind: "popup" as const,
  priority: 10,
  /** Ends the Monday after the last listed event. */
  endsAt: "2026-10-26T00:00:00+05:30",
};

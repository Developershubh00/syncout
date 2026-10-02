import type { SeedClub } from "./venues";

/**
 * Gardens Galleria Mall, Sector 38A, Noida — the busiest nightlife strip in
 * Noida. Addresses and hours are from published listings and change often;
 * correct them in Admin → Clubs, and switch off any venue that has closed.
 * Covers are original SyncOut artwork — upload real photos in Admin → Clubs.
 *
 * The first three are SyncOut House: our in-house clubs.
 */
const AREA = "Gardens Galleria, Sector 38A";
const mall = (where: string) => `${where}, Gardens Galleria Mall, Sector 38A, Noida`;
const HOUSE_TAGS = ["SyncOut House", "Premium crowd", "Food & drinks"];

export const GALLERIA_CLUBS: SeedClub[] = [
  {
    name: "Impulse",
    slug: "impulse-gardens-galleria",
    citySlug: "noida",
    area: AREA,
    address: mall("1st Floor"),
    tagline: "SyncOut House — premium crowd, full kitchen and bar",
    description:
      "Our in-house club on the first floor of Gardens Galleria. A big, bright room made for birthdays and big groups, a full kitchen and bar, and a door our own team runs — so the list you're on is the list they check. Bollywood and commercial sets till late.",
    coverImage: "/clubs/impulse-gardens-galleria.svg",
    musicTypes: ["Bollywood", "Commercial", "House"],
    tags: [...HOUSE_TAGS, "Big groups"],
    priceForTwo: null,
    openTime: "12:00 PM",
    closeTime: "1:00 AM",
    rating: null,
    reviewCount: 0,
    isFeatured: true,
    inHouse: true,
  },
  {
    name: "Levernasia",
    slug: "levernasia-gardens-galleria",
    citySlug: "noida",
    area: AREA,
    address: mall("205–206, 1st Floor"),
    tagline: "SyncOut House — LA-style club with a world kitchen",
    description:
      "An LA-inspired room with a VDJ booth, statement lighting and a kitchen that goes from Japanese and Italian to North Indian. One of our in-house clubs: premium crowd, signature cocktails, food on every table and our team on the door.",
    coverImage: "/clubs/levernasia-gardens-galleria.svg",
    musicTypes: ["Bollywood", "Commercial", "Hip-hop"],
    tags: [...HOUSE_TAGS, "VDJ"],
    priceForTwo: 2500,
    openTime: "12:15 PM",
    closeTime: "1:00 AM",
    rating: null,
    reviewCount: 0,
    isFeatured: true,
    inHouse: true,
  },
  {
    name: "Millionaire The Lux Club",
    slug: "millionaire-the-lux-club-gardens-galleria",
    citySlug: "noida",
    area: AREA,
    address: mall("320–326, 2nd Floor"),
    tagline: "SyncOut House — luxe nights on the second floor",
    description:
      "Plush, gold-lit and made for dressing up: Bollywood Saturdays and themed weeknights, with a kitchen doing North Indian, Chinese and bar bites. Our in-house club — premium crowd, food and drinks, our own door.",
    coverImage: "/clubs/millionaire-the-lux-club-gardens-galleria.svg",
    musicTypes: ["Bollywood", "Commercial", "Punjabi"],
    tags: [...HOUSE_TAGS, "Luxe"],
    priceForTwo: 3500,
    openTime: "12:00 PM",
    closeTime: "1:30 AM",
    rating: null,
    reviewCount: 0,
    isFeatured: true,
    inHouse: true,
  },
  ...(
    [
      ["Club BMD", "club-bmd-gardens-galleria", "Ground Floor", "A ground-floor party room built for celebrations", "A party-first room on the ground floor — popular for birthdays and group nights, with a dance floor that fills up after ten.", ["Bollywood", "Commercial"], ["Club", "Party venue"], null],
      ["Toy Boy", "toy-boy-gardens-galleria", "Gardens Galleria Mall", "Stylish room, energetic crowd", "A trendy club with a dressed-up crowd and a floor that stays busy on weekends.", ["Commercial", "House"], ["Club"], null],
      ["Big Boyz Lounge", "big-boyz-lounge-gardens-galleria", "C2A", "Lounge with an outdoor terrace", "A relaxed lounge with outdoor seating for groups — good for starting the night before heading upstairs.", ["Bollywood", "Punjabi"], ["Lounge", "Outdoor seating"], 2000],
      ["Dearie", "dearie-gardens-galleria", "1st Floor", "Lounge with a balcony over the mall", "A first-floor lounge with a balcony — cocktails, music and a view of the Galleria crowd.", ["Commercial", "Bollywood"], ["Lounge", "Balcony"], null],
      ["Ru-Bar-Ru, Gardens Galleria", "ru-bar-ru-gardens-galleria", "Ground Floor", "Upscale bar at the mall entrance", "Right at the entrance on the ground floor — an upscale bar and kitchen with inventive cocktails and a dressed-up crowd.", ["Commercial", "Bollywood"], ["Upscale", "Cocktails"], 3000],
      ["Lord of the Drinks, Noida", "lord-of-the-drinks-gardens-galleria", "1st Floor", "Grand gastropub with a live DJ", "A big, grand-looking gastropub with a live DJ and a long menu — a reliable pick for groups.", ["Commercial", "Bollywood"], ["Gastropub", "Live DJ"], null],
      ["Imperfecto, Gardens Galleria", "imperfecto-gardens-galleria", "Shop 341–342", "Rooftop gastropub at the edge of the mall", "A rooftop gastropub at the edge of Gardens Galleria — easy, lively and good for a big table.", ["Commercial", "Bollywood"], ["Rooftop", "Gastropub"], 2000],
      ["The Smoke Factory", "the-smoke-factory-gardens-galleria", "Gardens Galleria Mall", "Live music and a big menu", "Known for live music and a long food menu — a sit-down that turns into a party.", ["Live", "Commercial"], ["Live music", "Gastropub"], null],
      ["Growl", "growl-gardens-galleria", "311–312, 2nd Floor", "Second-floor bar with ladies' nights", "A second-floor bar that does ladies' nights well — loud, social and easy to reach from the escalators.", ["Commercial", "Bollywood"], ["Bar", "Ladies night"], null],
      ["Xero Courtyard", "xero-courtyard-gardens-galleria", "Shop 138", "Open courtyard bar", "An open, courtyard-style bar for groups who want air and a long table before the clubs.", ["Commercial", "Retro"], ["Courtyard", "Bar"], 2400],
      ["Illuzion Luxe Club", "illuzion-luxe-club-gardens-galleria", "Gardens Galleria Mall", "Luxury club, big-room sound", "A newer luxury club that mixes big-room sound with a sleek, lit-up interior.", ["House", "Commercial"], ["Club", "Luxury"], null],
    ] as const
  ).map(([name, slug, where, tagline, description, music, tags, price]) => ({
    name,
    slug,
    citySlug: "noida",
    area: AREA,
    address: mall(where),
    tagline,
    description,
    coverImage: `/clubs/${slug}.svg`,
    musicTypes: [...music],
    tags: [...tags],
    priceForTwo: price,
    openTime: "12:00 PM",
    closeTime: "1:00 AM",
    rating: null,
    reviewCount: 0,
  })),
];

/**
 * Seeds cities, clubs, two weeks of nights and a few offers.
 * Run: npm run db:seed   (safe to re-run — it clears and rebuilds)
 */
import "./load-env";
import { db } from "./index";
import { cities, clubs, events, offers, reviews } from "./schema";
import { CITIES, CLUBS, EVENT_TEMPLATES } from "../data/venues";
import { NCR_CLUBS } from "../data/venues-ncr";

const ALL_CLUBS = [...CLUBS, ...NCR_CLUBS];
import { slugify } from "../lib/utils";

function nightAt(daysAhead: number, hour = 21) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  // IST is UTC+5:30, so 21:00 IST == 15:30 UTC.
  d.setUTCHours(hour - 6, 30, 0, 0);
  return d;
}

async function main() {
  console.log("→ clearing");
  await db.delete(reviews);
  await db.delete(offers);
  await db.delete(events);
  await db.delete(clubs);
  await db.delete(cities);

  console.log("→ cities");
  await db.insert(cities).values(CITIES.map((c) => ({ ...c, isActive: true })));

  console.log("→ clubs");
  const inserted = await db
    .insert(clubs)
    .values(
      ALL_CLUBS.map((c, i) => ({
        name: c.name,
        slug: c.slug,
        citySlug: c.citySlug,
        area: c.area,
        address: c.address ?? null,
        tagline: c.tagline,
        description: c.description,
        coverImage: c.coverImage,
        gallery: [c.coverImage],
        musicTypes: c.musicTypes,
        tags: c.tags,
        priceForTwo: c.priceForTwo,
        openTime: c.openTime,
        closeTime: c.closeTime,
        dressCode: c.dressCode ?? "Smart casuals. No shorts, no slippers.",
        rating: c.rating,
        reviewCount: c.reviewCount,
        isFeatured: c.isFeatured ?? false,
        sortOrder: i,
      }))
    )
    .returning();

  console.log(`   ${inserted.length} clubs`);

  console.log("→ events (next 14 nights)");
  const rows: (typeof events.$inferInsert)[] = [];

  for (let day = 0; day < 14; day++) {
    const date = nightAt(day);
    const weekday = date.getUTCDay();
    const tpl = EVENT_TEMPLATES.find((t) => t.weekday === weekday);
    if (!tpl) continue;

    // 5–8 venues host on any given night
    const hosts = inserted.filter((_, i) => (i + day) % 3 === 0);

    for (const club of hosts) {
      const slug = slugify(`${club.slug}-${tpl.title}-${date.toISOString().slice(0, 10)}`);
      rows.push({
        clubId: club.id,
        title: tpl.title,
        slug,
        description: `${tpl.title} at ${club.name}. ${club.tagline}. Doors ${club.openTime}, guestlist confirmed by 6 PM.`,
        poster: club.coverImage,
        gallery: club.gallery,
        artist: tpl.artist,
        musicType: tpl.musicType,
        startsAt: date,
        endsAt: new Date(date.getTime() + 4 * 3600e3),
        guestlistOpen: true,
        cutoffHour: 18,
        femaleEnabled: true,
        femaleLimit: 40,
        femalePrice: 0,
        coupleEnabled: true,
        coupleLimit: 30,
        couplePrice: 0,
        maleEnabled: weekday !== 3, // guys' list shut on Ladies Night
        maleLimit: 15,
        malePrice: 0,
        perks: tpl.perks,
        isFeatured: club.isFeatured && day < 4,
      });
    }
  }

  for (let i = 0; i < rows.length; i += 40) {
    await db.insert(events).values(rows.slice(i, i + 40));
  }
  console.log(`   ${rows.length} nights`);

  console.log("→ offers");
  await db.insert(offers).values([
    {
      title: "Food & drinks on us",
      subtitle: "Approved guestlist only",
      description:
        "Get approved before 6 PM and your entry, starters and house drinks are covered for the night. Nothing to pay at the door.",
      image: inserted[0].coverImage,
      clubId: null,
      isActive: true,
      sortOrder: 1,
    },
    {
      title: "Girls go free, always",
      subtitle: "Every night, every venue",
      description: "No cover for girls on the SyncOut list. Bring your friends, the list takes up to four.",
      image: inserted[4].coverImage,
      clubId: inserted[4].id,
      isActive: true,
      sortOrder: 2,
    },
    {
      title: "Couples skip the queue",
      subtitle: "Priority door till 11:30 PM",
      description: "Approved couples walk past the line. Show your pass at the door and go straight in.",
      image: inserted[6].coverImage,
      clubId: inserted[6].id,
      isActive: true,
      sortOrder: 3,
    },
  ]);

  console.log("→ reviews");
  await db.insert(reviews).values([
    {
      clubId: inserted[0].id,
      authorName: "Sneha Sharma",
      rating: 5,
      body: "Vibrant room, brilliant drinks, and the crowd made the night. The list was confirmed by evening and the door knew our names.",
      isApproved: true,
    },
    {
      clubId: inserted[4].id,
      authorName: "Rahul M.",
      rating: 5,
      body: "Applied at 4, approved at 5:40, walked in at 10 without paying a rupee. Food was actually good too.",
      isApproved: true,
    },
    {
      clubId: inserted[17].id,
      authorName: "Ananya G.",
      rating: 4,
      body: "Went with three friends on the girls' list. Straight in, drinks sorted, no awkwardness at the door.",
      isApproved: true,
    },
  ]);

  console.log("✓ seeded");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Fills in anything missing — never deletes.
 *
 *   npm run db:seed            cities, clubs, two weeks of sample nights,
 *                              offers (if none), Navratri 2026 events,
 *                              the Dandiya popup and default settings
 *   npm run db:seed -- --demo  also adds sample reviews
 *   npm run db:seed -- --reset WIPES clubs, nights and events first. Refuses
 *                              while any guestlist booking or ticket order
 *                              exists, because those would be deleted too.
 *
 * Safe to run against production: existing rows (and anything you edited in
 * the admin panel) are left exactly as they are.
 */
import "./load-env";
import { db } from "./index";
import { bookings, cities, clubs, events, offers, reviews, ticketOrders, ticketedEvents } from "./schema";
import { istNightWindow } from "../lib/guestlist";
import { seedCitiesAndClubs, seedNights, seedNavratri } from "./seed-core";
import { asc, count } from "drizzle-orm";
const args = new Set(process.argv.slice(2));

async function reset() {
  const [[b], [o]] = await Promise.all([
    db.select({ n: count() }).from(bookings),
    db.select({ n: count() }).from(ticketOrders),
  ]);
  if (b.n + o.n > 0) {
    console.error(
      `✗ --reset refused: ${b.n} guestlist booking(s) and ${o.n} ticket order(s) would be deleted with the clubs and events.\n` +
        "  Run plain `npm run db:seed` instead — it only adds what's missing."
    );
    process.exit(1);
  }
  console.log("→ clearing clubs, nights, events, offers, reviews");
  await db.delete(reviews);
  await db.delete(offers);
  await db.delete(events);
  await db.delete(ticketedEvents);
  await db.delete(clubs);
  await db.delete(cities);
}

async function main() {
  if (args.has("--reset")) await reset();

  console.log("→ cities & clubs");
  console.log(`   ${await seedCitiesAndClubs()} new clubs`);
  const allClubs = await db.select().from(clubs).orderBy(asc(clubs.sortOrder), asc(clubs.name));

  console.log("→ club nights (next 14 days)");
  console.log(`   ${await seedNights()} new`);

  const [{ n: offerCount }] = await db.select({ n: count() }).from(offers);
  if (offerCount === 0 && allClubs.length > 6) {
    console.log("→ offers");
    await db.insert(offers).values([
      {
        title: "Sponsor night: open bar till 11",
        subtitle: "Tonight only",
        description: "First hour is on the sponsor for anyone approved on tonight's list. Turn up before eleven and the tab is covered.",
        image: allClubs[2].coverImage,
        clubId: allClubs[2].id,
        validTill: istNightWindow().to,
        sortOrder: 0,
      },
      {
        title: "Food & drinks on us",
        subtitle: "Approved guestlist only",
        description: "Get approved before 6 PM and your entry, starters and house drinks are covered for the night. Nothing to pay at the door.",
        image: allClubs[0].coverImage,
        sortOrder: 1,
      },
      {
        title: "Girls go free, always",
        subtitle: "Every night, every venue",
        description: "No cover for girls on the SyncOut list. Bring your friends, the list takes up to five.",
        image: allClubs[4].coverImage,
        sortOrder: 2,
      },
      {
        title: "Couples skip the queue",
        subtitle: "Priority door till 11:30 PM",
        description: "Approved couples walk past the line. Show your pass at the door and go straight in.",
        image: allClubs[6].coverImage,
        clubId: allClubs[6].id,
        sortOrder: 3,
      },
    ]);
  }

  if (args.has("--demo")) {
    const [{ n }] = await db.select({ n: count() }).from(reviews);
    if (n === 0 && allClubs.length > 4) {
      console.log("→ demo reviews");
      await db.insert(reviews).values([
        { clubId: allClubs[0].id, authorName: "Demo review", rating: 5, body: "Sample review for local testing.", isApproved: true },
      ]);
    }
  }

  console.log("→ Navratri 2026 events, Dandiya popup, settings");
  console.log(`   ${await seedNavratri()} new events`);

  console.log("✓ seeded — nothing existing was changed. A running site shows new events within 2 minutes.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

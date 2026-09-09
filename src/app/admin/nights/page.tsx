import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { clubs, events } from "@/db/schema";
import { desc, eq, gte } from "drizzle-orm";
import { NightManager } from "@/components/admin/NightManager";

export const dynamic = "force-dynamic";

export default async function AdminNights() {
  if (!(await getAdmin())) redirect("/admin");

  const [clubList, rows] = await Promise.all([
    db.select({ id: clubs.id, name: clubs.name, coverImage: clubs.coverImage }).from(clubs),
    db
      .select({
        id: events.id, title: events.title, slug: events.slug, poster: events.poster,
        startsAt: events.startsAt, guestlistOpen: events.guestlistOpen, isActive: events.isActive,
        femaleLimit: events.femaleLimit, coupleLimit: events.coupleLimit, maleLimit: events.maleLimit,
        femaleEnabled: events.femaleEnabled, coupleEnabled: events.coupleEnabled, maleEnabled: events.maleEnabled,
        clubId: events.clubId, clubName: clubs.name,
      })
      .from(events)
      .innerJoin(clubs, eq(events.clubId, clubs.id))
      .where(gte(events.startsAt, new Date(Date.now() - 7 * 864e5)))
      .orderBy(desc(events.startsAt))
      .limit(150),
  ]);

  return (
    <NightManager
      clubs={clubList}
      initial={rows.map((r) => ({ ...r, startsAt: String(r.startsAt) }))}
    />
  );
}

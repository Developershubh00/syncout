import "server-only";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

export async function activeAnnouncementsRaw() {
  const at = new Date();
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      image: announcements.image,
      ctaLabel: announcements.ctaLabel,
      ctaUrl: announcements.ctaUrl,
      kind: announcements.kind,
      audience: announcements.audience,
      theme: announcements.theme,
      cities: announcements.cities,
    })
    .from(announcements)
    .where(
      and(
        eq(announcements.isActive, true),
        or(isNull(announcements.startsAt), lte(announcements.startsAt, at)),
        or(isNull(announcements.endsAt), gte(announcements.endsAt, at))
      )
    )
    .orderBy(desc(announcements.priority), desc(announcements.createdAt))
    .limit(6);
}

export type ActiveAnnouncement = Awaited<ReturnType<typeof activeAnnouncementsRaw>>[number];

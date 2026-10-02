import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { AnnouncementManager } from "@/components/admin/AnnouncementManager";

export const dynamic = "force-dynamic";

export default async function AdminAnnouncements() {
  if (!(await getAdmin())) redirect("/admin");
  const rows = await db.select().from(announcements).orderBy(desc(announcements.priority), desc(announcements.createdAt)).catch(() => []);
  return (
    <AnnouncementManager
      initial={rows.map((a) => ({
        ...a,
        startsAt: a.startsAt ? a.startsAt.toISOString() : null,
        endsAt: a.endsAt ? a.endsAt.toISOString() : null,
      }))}
    />
  );
}

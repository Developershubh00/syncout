import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { asc } from "drizzle-orm";
import { ClubManager } from "@/components/admin/ClubManager";

export const dynamic = "force-dynamic";

export default async function AdminClubs() {
  if (!(await getAdmin())) redirect("/admin");
  const rows = await db.select().from(clubs).orderBy(asc(clubs.sortOrder));
  return <ClubManager initial={rows} />;
}

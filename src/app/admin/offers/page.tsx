import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { clubs, offers } from "@/db/schema";
import { OfferManager } from "@/components/admin/OfferManager";

export const dynamic = "force-dynamic";

export default async function AdminOffers() {
  if (!(await getAdmin())) redirect("/admin");
  const [rows, clubList] = await Promise.all([
    db.select().from(offers).orderBy(asc(offers.sortOrder)).catch(() => []),
    db.select({ id: clubs.id, name: clubs.name }).from(clubs).orderBy(asc(clubs.name)).catch(() => []),
  ]);
  return <OfferManager initial={rows.map((o) => ({ ...o, validTill: o.validTill ? o.validTill.toISOString() : null }))} clubs={clubList} />;
}

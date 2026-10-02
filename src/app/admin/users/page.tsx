import { redirect } from "next/navigation";
import { desc, ilike, or, sql } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { users } from "@/db/schema";
import { UserRow } from "@/components/admin/AdminRows";
import { AdminSearch } from "@/components/admin/AdminSearch";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const { q } = await searchParams;
  const term = q?.trim() ? `%${q.trim().replace(/[\\%_]/g, (c) => "\\" + c)}%` : null;
  const rows = await db
    .select({
      id: users.id, name: users.name, email: users.email, phone: users.phone, isBlocked: users.isBlocked, createdAt: users.createdAt,
      bookings: sql<number>`(select count(*) from bookings b where b.user_id = ${users.id})`.mapWith(Number),
      orders: sql<number>`(select count(*) from ticket_orders o where o.user_id = ${users.id})`.mapWith(Number),
    })
    .from(users)
    .where(term ? or(ilike(users.name, term), ilike(users.email, term), ilike(users.phone, term)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(150)
    .catch(() => []);
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Users</h1>
      <p className="mt-1 text-[12.5px] text-muted">Search, block, send a password-reset link on WhatsApp, or delete an account.</p>
      <AdminSearch placeholder="Name, email or phone" />
      <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
        {rows.map((u) => <UserRow key={u.id} u={{ ...u, createdAt: String(u.createdAt) }} />)}
      </ul>
      {rows.length === 0 && <p className="mt-6 text-center text-[13px] text-muted">No users{q ? ` matching "${q}"` : ""}.</p>}
      <div className="h-10" />
    </div>
  );
}

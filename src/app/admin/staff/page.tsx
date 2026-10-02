import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { staff } from "@/db/schema";
import { StaffManager } from "@/components/admin/StaffManager";
import { absUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function AdminStaff() {
  if (!(await getAdmin())) redirect("/admin");
  const rows = await db
    .select({ id: staff.id, name: staff.name, phone: staff.phone, isActive: staff.isActive, lastLoginAt: staff.lastLoginAt })
    .from(staff)
    .orderBy(asc(staff.name))
    .catch(() => []);
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Door staff</h1>
      <p className="mb-5 mt-1 text-[12.5px] text-muted">Volunteers and bouncers who scan tickets at <b>{absUrl("/door")}</b> — without access to the rest of the admin.</p>
      <StaffManager rows={rows.map((r) => ({ ...r, lastLoginAt: r.lastLoginAt ? String(r.lastLoginAt) : null }))} doorUrl={absUrl("/door")} />
      <div className="h-10" />
    </div>
  );
}

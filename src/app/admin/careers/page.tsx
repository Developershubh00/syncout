import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { jobApplications, jobOpenings } from "@/db/schema";
import { ApplicationRow } from "@/components/admin/AdminRows";
import { OpeningsManager } from "@/components/admin/OpeningsManager";

export const dynamic = "force-dynamic";

export default async function AdminCareers({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const { status = "new" } = await searchParams;
  const [openings, apps] = await Promise.all([
    db.select().from(jobOpenings).orderBy(asc(jobOpenings.sortOrder), asc(jobOpenings.title)).catch(() => []),
    db.select().from(jobApplications).where(status === "all" ? undefined : eq(jobApplications.status, status)).orderBy(desc(jobApplications.createdAt)).limit(200).catch(() => []),
  ]);
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Careers</h1>
      <p className="mt-1 text-[12.5px] text-muted">Roles on /careers (jobs, internships, volunteers) and everyone who applied.</p>

      <h2 className="mt-6 text-[17px]">Applications</h2>
      <div className="rail chips py-3">
        {["new", "shortlisted", "hired", "rejected", "all"].map((s) => (
          <Link key={s} href={`/admin/careers?status=${s}`} className={"rounded-full border px-3.5 py-1.5 text-[13px] " + (s === status ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")}>
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>
      <ul className="grid gap-2.5 lg:grid-cols-2">
        {apps.map((a) => <ApplicationRow key={a.id} a={{ ...a, createdAt: String(a.createdAt) }} />)}
      </ul>
      {apps.length === 0 && <p className="text-[13px] text-muted">No applications here yet.</p>}

      <h2 className="mt-10 text-[17px]">Roles</h2>
      <p className="mb-3 mt-1 text-[12.5px] text-muted">{openings.length ? "Edit what shows on /careers." : "Until you add roles, /careers shows the built-in defaults. Load them here to edit."}</p>
      <OpeningsManager initial={openings} />
      <div className="h-10" />
    </div>
  );
}

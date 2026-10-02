import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { InquiryRow } from "@/components/admin/AdminRows";

export const dynamic = "force-dynamic";

export default async function AdminInbox({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const { status = "new" } = await searchParams;
  const rows = await db
    .select()
    .from(inquiries)
    .where(status === "all" ? undefined : eq(inquiries.status, status))
    .orderBy(desc(inquiries.createdAt))
    .limit(200)
    .catch(() => []);
  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Inbox</h1>
      <p className="mt-1 text-[12.5px] text-muted">Messages from the Contact page — booking help, venues and organisers, press, volunteers.</p>
      <div className="rail chips py-3.5">
        {["new", "handled", "all"].map((s) => (
          <Link key={s} href={`/admin/inbox?status=${s}`} className={"rounded-full border px-3.5 py-1.5 text-[13px] " + (s === status ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")}>
            {s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>
      <ul className="grid gap-2.5 lg:grid-cols-2">
        {rows.map((q) => <InquiryRow key={q.id} q={{ ...q, createdAt: String(q.createdAt) }} />)}
      </ul>
      {rows.length === 0 && <p className="mt-6 text-center text-[13px] text-muted">Nothing here.</p>}
      <div className="h-10" />
    </div>
  );
}

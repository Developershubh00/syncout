import Link from "next/link";
import { getAdmin } from "@/lib/session";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adminStats, adminBookings } from "@/lib/queries";
import { friendlyDate, fmtTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export default async function AdminHome() {
  if (!(await getAdmin())) return <AdminLogin />;

  const [stats, pending] = await Promise.all([adminStats(), adminBookings("pending", 6)]);

  return (
    <div className="px-4 pt-6 lg:px-0 lg:pt-8">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">
        Overview
      </h1>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        <Stat n={stats.pending} label="Awaiting review" accent />
        <Stat n={stats.tonight} label="Nights on tonight" />
        <Stat n={stats.approved} label="Approved" />
        <Stat n={stats.heads} label="Heads on lists" />
        <Stat n={stats.bookings} label="Total applications" />
        <Stat n={stats.upcoming} label="Upcoming nights" />
        <Stat n={stats.clubs} label="Venues" />
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-[17px]">Needs a decision</h2>
          <Link href="/admin/bookings" className="flex items-center gap-1 text-[12.5px] font-semibold text-red">
            All <ArrowRight className="size-3.5" />
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-muted">
            Nothing waiting. The list is clear.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[18px] border border-line bg-surface">
            {pending.map((b) => (
              <li key={b.id} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="truncate text-[14px] font-semibold">{b.guestName}</p>
                  <span className="shrink-0 text-[11.5px] tracking-[0.08em] text-muted">{b.code}</span>
                </div>
                <p className="mt-0.5 truncate text-[12.5px] text-muted">
                  {b.clubName} · {b.eventTitle} · {friendlyDate(b.startsAt)} {fmtTime(b.startsAt)}
                </p>
                <p className="mt-0.5 text-[12px] text-faint">
                  {b.entryType === "couple" ? "Couple" : b.entryType === "stag_female" ? "Girls" : "Guys"} ·{" "}
                  {b.totalGuests} guest{b.totalGuests > 1 ? "s" : ""} · {b.guestPhone}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-[18px] border border-line bg-surface p-4">
        <h2 className="text-[15px]">Daily rhythm</h2>
        <ol className="mt-2.5 space-y-2 text-[13px] leading-relaxed text-muted">
          <li>Applications come in through the day and sit in Guestlist as pending.</li>
          <li>Work the list down before 6 PM — approving sends the guest their pass by email.</li>
          <li>At the venue, open Door and check codes off as people arrive.</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div className={"rounded-2xl border p-3.5 " + (accent ? "border-red/35 bg-red/[0.07]" : "border-line bg-surface")}>
      <p className={"font-display text-[26px] font-extrabold leading-none " + (accent ? "text-red-hot" : "")}>{n}</p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  );
}

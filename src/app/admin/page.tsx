import Link from "next/link";
import { getAdmin } from "@/lib/session";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { adminStats, adminBookings } from "@/lib/queries";
import { friendlyDate, fmtTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { dbHealth } from "@/db/health";
import { SetupPanel } from "@/components/admin/SetupPanel";
import { AdminAlertsToggle } from "@/components/admin/AdminAlertsToggle";
import { db } from "@/db";
import { inquiries, jobApplications } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export default async function AdminHome() {
  if (!(await getAdmin())) return <AdminLogin />;

  const [stats, pending, health, inbox, apps] = await Promise.all([
    adminStats(),
    adminBookings("pending", 6),
    dbHealth(),
    db.select({ n: count() }).from(inquiries).where(eq(inquiries.status, "new")).then((r) => r[0]?.n ?? 0).catch(() => 0),
    db.select({ n: count() }).from(jobApplications).where(eq(jobApplications.status, "new")).then((r) => r[0]?.n ?? 0).catch(() => 0),
  ]);
  const needsSetup = !health.reachable || health.missing.length > 0 || health.upcomingEvents === 0 || health.upcomingNights === 0;

  return (
    <div className="px-4 pt-6 lg:px-0 lg:pt-8">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">
        Overview
      </h1>

      {needsSetup && <SetupPanel health={health} />}

      <div className="mt-4 rounded-[18px] border border-line bg-surface p-4">
        <p className="text-[14px] font-semibold">Booking alerts</p>
        <p className="mb-3 mt-0.5 text-[12.5px] text-muted">
          A notification on this phone or laptop for every new booking, payment and guestlist request — even when the app is closed. On iPhone, add SyncOut Admin to your Home Screen first.
        </p>
        <div className="max-w-[320px]"><AdminAlertsToggle /></div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
        <Stat n={stats.pending} label="Guestlist to review" accent href="/admin/bookings?status=pending" />
        <Stat n={stats.toVerify} label="Payments to verify" accent href="/admin/orders?status=payment_submitted" />
        <Stat n={`₹${stats.paidToday.toLocaleString("en-IN")}`} label="Confirmed today" href="/admin/orders?status=confirmed" />
        <Stat n={inbox} label="New messages" accent={inbox > 0} href="/admin/inbox" />
        <Stat n={apps} label="New applications" href="/admin/careers" />
        <Stat n={stats.tonight} label="Nights on tonight" />
        <Stat n={stats.approved} label="Approved tonight" />
        <Stat n={stats.heads} label="Heads on tonight's lists" />
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
          <li>Work the list down before 6 PM — approving sends the guest their pass by email and a notification.</li>
          <li>Event bookings: check the UPI payment against the screenshot on WhatsApp, then Confirm in Event bookings.</li>
          <li>At the venue, open Door and check codes off as people arrive.</li>
        </ol>
      </section>
    </div>
  );
}

function Stat({ n, label, accent, href }: { n: number | string; label: string; accent?: boolean; href?: string }) {
  const box = (
    <div className={"h-full rounded-2xl border p-3.5 " + (accent ? "border-red/35 bg-red/[0.07]" : "border-line bg-surface")}>
      <p className={"font-display text-[26px] font-extrabold leading-none " + (accent ? "text-red-hot" : "")}>{n}</p>
      <p className="mt-1.5 text-[12px] text-muted">{label}</p>
    </div>
  );
  return href ? <Link href={href}>{box}</Link> : box;
}

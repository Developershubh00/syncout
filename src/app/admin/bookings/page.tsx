import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { adminBookings, adminNightOptions } from "@/lib/queries";
import { BookingRow } from "@/components/admin/BookingRow";
import { BulkActions } from "@/components/admin/BulkActions";
import { NightFilter } from "@/components/admin/NightFilter";

export const dynamic = "force-dynamic";

const FILTERS = ["pending", "approved", "waitlisted", "rejected", "checked_in", "all"] as const;
const LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  waitlisted: "Waitlist",
  rejected: "Rejected",
  checked_in: "Checked in",
  all: "All",
};

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string; event?: string }> }) {
  if (!(await getAdmin())) redirect("/admin");

  const { status = "pending", event } = await searchParams;
  const [rows, nights] = await Promise.all([adminBookings(status, 300, event), adminNightOptions()]);
  const night = nights.find((n) => n.id === event);

  return (
    <div className="pt-6">
      <div className="flex flex-wrap items-center gap-3 px-4 lg:px-0">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Guestlist</h1>
        <div className="ml-auto flex gap-2">
          {event && (
            <Link href={`/admin/notify?audience=night&target=${event}`} className="inline-flex h-9 items-center rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold">
              Message these guests
            </Link>
          )}
          <a href={event ? `/api/admin/export?event=${event}` : "/api/admin/export"} className="inline-flex h-9 items-center rounded-lg border border-line bg-raised px-3 text-[13px] font-semibold">
            {event ? "Export this night" : "Export tonight's door list"}
          </a>
        </div>
      </div>

      <div className="mt-3 px-4 lg:px-0">
        <NightFilter options={nights.map((n) => ({ ...n, startsAt: String(n.startsAt) }))} value={event} status={status} />
      </div>

      <div className="rail chips py-3.5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/bookings?status=${f}${event ? `&event=${event}` : ""}`}
            className={"rounded-full border px-3.5 py-1.5 text-[13px] " + (f === status ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")}
          >
            {LABEL[f]}
          </Link>
        ))}
      </div>

      <div className="px-4 lg:px-0">
        <BulkActions
          ids={rows.filter((r) => r.status === "pending").map((r) => r.id)}
          scope={night ? `${night.clubName} · ${night.title}` : null}
        />
      </div>

      {rows.length === 0 ? (
        <p className="mx-4 mt-3 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted lg:mx-0">Nothing here.</p>
      ) : (
        <ul className="mt-3 space-y-2.5 px-4 lg:px-0">
          {rows.map((b) => (
            <BookingRow key={b.id} b={{ ...b, startsAt: String(b.startsAt), createdAt: String(b.createdAt) }} />
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}

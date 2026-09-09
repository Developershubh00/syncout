import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { adminBookings } from "@/lib/queries";
import { BookingRow } from "@/components/admin/BookingRow";

export const dynamic = "force-dynamic";

const FILTERS = ["pending", "approved", "rejected", "checked_in", "all"] as const;
const LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  checked_in: "Checked in",
  all: "All",
};

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await getAdmin())) redirect("/admin");

  const { status = "pending" } = await searchParams;
  const rows = await adminBookings(status);

  return (
    <div className="pt-6">
      <h1 className="px-4 font-display text-[24px] font-extrabold tracking-tight">Guestlist</h1>

      <div className="rail py-3.5">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={`/admin/bookings?status=${f}`}
            className={
              "rounded-full border px-3.5 py-1.5 text-[13px] " +
              (f === status ? "border-red bg-red/12 text-red-hot" : "border-line text-muted")
            }
          >
            {LABEL[f]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mx-4 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
          Nothing here.
        </p>
      ) : (
        <ul className="space-y-2.5 px-4">
          {rows.map((b) => (
            <BookingRow key={b.id} b={{ ...b, startsAt: String(b.startsAt), createdAt: String(b.createdAt) }} />
          ))}
        </ul>
      )}
      <div className="h-10" />
    </div>
  );
}

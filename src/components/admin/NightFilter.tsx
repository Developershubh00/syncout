"use client";
import { useRouter } from "next/navigation";
import { friendlyDate, fmtTime } from "@/lib/utils";

type Opt = { id: string; title: string; clubName: string; startsAt: string; pending: number; total: number };

export function NightFilter({ options, value, status }: { options: Opt[]; value?: string; status: string }) {
  const router = useRouter();
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const ev = e.target.value;
        router.push(`/admin/bookings?status=${status}${ev ? `&event=${ev}` : ""}`);
      }}
      className="h-11 w-full rounded-xl border border-line bg-raised px-3 text-[13.5px] lg:max-w-[520px]"
    >
      <option value="">All nights</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {friendlyDate(o.startsAt)} {fmtTime(o.startsAt)} · {o.clubName} · {o.title} ({o.pending} pending / {o.total})
        </option>
      ))}
    </select>
  );
}

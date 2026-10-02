"use client";
import { useRouter } from "next/navigation";

export function EventFilter({ options, value, status }: { options: { id: string; title: string; toVerify: number; orders: number }[]; value?: string; status: string }) {
  const router = useRouter();
  return (
    <select
      value={value ?? ""}
      onChange={(e) => router.push(`/admin/orders?status=${status}${e.target.value ? `&event=${e.target.value}` : ""}`)}
      className="h-11 w-full rounded-xl border border-line bg-raised px-3 text-[13.5px] lg:max-w-[520px]"
    >
      <option value="">All events</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.title} ({o.toVerify} to verify / {o.orders})
        </option>
      ))}
    </select>
  );
}

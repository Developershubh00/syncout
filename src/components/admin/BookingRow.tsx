"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, X, Phone, Instagram, Clock, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { friendlyDate, fmtTime, cn } from "@/lib/utils";

type B = {
  id: string; code: string; status: string; entryType: string;
  femaleCount: number; maleCount: number; totalGuests: number;
  guestName: string; guestPhone: string; guestEmail: string;
  guestInstagram: string | null; arrivalTime: string | null; notes: string | null;
  createdAt: string; eventTitle: string; startsAt: string; clubName: string;
};

const STATUS: Record<string, string> = {
  pending: "bg-raised text-muted",
  approved: "bg-gold/15 text-gold",
  checked_in: "bg-gold/15 text-gold",
  rejected: "bg-red/12 text-red-hot",
  no_show: "bg-red/12 text-red-hot",
  waitlisted: "bg-raised text-muted",
  cancelled: "bg-raised text-faint",
};

export function BookingRow({ b }: { b: B }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function setStatus(status: string, reason?: string) {
    setBusy(status);
    try {
      const res = await fetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(
        status === "approved"
          ? `${b.guestName} approved — pass emailed`
          : status === "rejected"
          ? `${b.guestName} declined`
          : `Marked ${status.replace("_", " ")}`
      );
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setBusy(null);
    }
  }

  const entry = b.entryType === "couple" ? "Couple" : b.entryType === "stag_female" ? "Girls" : "Guys";

  return (
    <li className="overflow-hidden rounded-[18px] border border-line bg-surface">
      <button onClick={() => setOpen((o) => !o)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold">{b.guestName}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">
              {b.clubName} · {b.eventTitle}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", STATUS[b.status])}>
              {b.status.replace("_", " ")}
            </span>
            <ChevronDown className={cn("size-4 text-faint transition-transform", open && "rotate-180")} />
          </div>
        </div>

        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-faint">
          <span className="tracking-[0.08em] text-muted">{b.code}</span>
          <span>{entry}</span>
          <span>{b.totalGuests} guest{b.totalGuests > 1 ? "s" : ""} ({b.femaleCount}F / {b.maleCount}M)</span>
          <span>{friendlyDate(b.startsAt)} {fmtTime(b.startsAt)}</span>
        </p>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="overflow-hidden border-t border-line"
        >
          <div className="space-y-2.5 p-4 text-[13px]">
            <a href={`tel:${b.guestPhone}`} className="flex items-center gap-2 text-muted">
              <Phone className="size-4" /> {b.guestPhone}
            </a>
            <p className="flex items-center gap-2 break-all text-muted">
              <span className="grid size-4 place-items-center text-[10px]">@</span> {b.guestEmail}
            </p>
            {b.guestInstagram && (
              <p className="flex items-center gap-2 text-muted">
                <Instagram className="size-4" /> {b.guestInstagram}
              </p>
            )}
            <p className="flex items-center gap-2 text-muted">
              <Clock className="size-4" /> Reaching by {b.arrivalTime ?? "—"}
            </p>
            {b.notes && (
              <p className="rounded-xl bg-raised p-3 leading-relaxed text-muted">{b.notes}</p>
            )}

            <div className="flex flex-wrap gap-2 pt-1.5">
              {b.status !== "approved" && (
                <Button size="sm" loading={busy === "approved"} onClick={() => setStatus("approved")}>
                  <Check className="size-3.5" /> Approve
                </Button>
              )}
              {b.status !== "rejected" && (
                <Button
                  size="sm"
                  variant="danger"
                  loading={busy === "rejected"}
                  onClick={() => setStatus("rejected", "The list filled up for this night.")}
                >
                  <X className="size-3.5" /> Decline
                </Button>
              )}
              {b.status === "approved" && (
                <Button size="sm" variant="ghost" loading={busy === "checked_in"} onClick={() => setStatus("checked_in")}>
                  Check in
                </Button>
              )}
              <Button size="sm" variant="ghost" loading={busy === "waitlisted"} onClick={() => setStatus("waitlisted")}>
                Waitlist
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </li>
  );
}

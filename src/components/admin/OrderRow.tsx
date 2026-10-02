"use client";
import { QrCode } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Phone, MessageCircle, ChevronDown, LogIn, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { ORDER_STATUS } from "@/lib/event-labels";
import { dayLabel, rs } from "@/lib/event-format";
import { guestWaLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/db/schema";

type O = {
  id: string; code: string; status: OrderStatus; mode: string; name: string; phone: string; email: string;
  eventTitle: string; day: string | null; tierName: string; quantity: number; admits: number; amount: number;
  utr: string | null; note: string | null; adminNote: string | null; whatsappAt: string | null; createdAt: string; hasAccount: boolean;
};

export function OrderRow({ o }: { o: O }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(o.status === "payment_submitted");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState(o.adminNote ?? "");

  async function patch(body: Record<string, unknown>, label: string) {
    setBusy(label);
    try {
      const res = await fetch(`/api/admin/orders/${o.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(label === "note" ? "Note saved" : `${o.name}: ${label}`);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed", "err");
    } finally {
      setBusy(null);
    }
  }

  const when = o.day ? dayLabel(o.day) : "";
  const look = ORDER_STATUS[o.status];
  const waText = `Hi ${o.name.split(" ")[0]}, this is SyncOut about your booking ${o.code} for ${o.eventTitle}${when ? ` (${when})` : ""}.`;

  return (
    <li className={cn("overflow-hidden rounded-[18px] border bg-surface", o.status === "payment_submitted" ? "border-gold/35" : "border-line")}>
      <button onClick={() => setOpen((x) => !x)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[14.5px] font-semibold">{o.name}</p>
            <p className="mt-0.5 truncate text-[12.5px] text-muted">{o.eventTitle}{when ? ` · ${when}` : ""}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-display text-[15px] font-extrabold text-gold">{rs(o.amount)}</span>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold", look.cls)}>{look.label}</span>
            <ChevronDown className={cn("size-4 text-faint transition-transform", open && "rotate-180")} />
          </div>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-faint">
          <a href={`/admin/tickets/${o.code}`} className="inline-flex items-center gap-1 tracking-[0.08em] text-muted underline-offset-2 hover:text-text hover:underline" title="QR, barcode and full details">{o.code} <QrCode className="size-3.5" /></a>
          <span>{o.quantity} × {o.tierName}</span>
          <span>{o.admits} {o.admits === 1 ? "person" : "people"}</span>
          {o.utr && <span className="text-text">UTR {o.utr}</span>}
          {o.whatsappAt && <span className="text-[#25D366]">sent proof on WhatsApp</span>}
          <span>{o.mode === "whatsapp" ? "via WhatsApp" : o.mode === "free" ? "free RSVP" : "UPI"}</span>
        </p>
      </button>

      {open && (
        <div className="space-y-3 border-t border-line p-4 text-[13px]">
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${o.phone}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-raised px-3 font-semibold"><Phone className="size-3.5" /> {o.phone}</a>
            <a href={guestWaLink(o.phone, waText)} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-3 font-semibold text-[#25D366]">
              <MessageCircle className="size-3.5" /> WhatsApp
            </a>
            <span className="inline-flex h-9 items-center break-all rounded-lg bg-raised px-3 text-muted">{o.email}</span>
            {!o.hasAccount && <span className="inline-flex h-9 items-center rounded-lg px-1 text-[11.5px] text-faint">no account — in-app alerts won&apos;t reach them</span>}
          </div>
          {o.note && <p className="rounded-xl bg-raised p-3 leading-relaxed text-muted">“{o.note}”</p>}

          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Private note (e.g. paid ₹1,998 via PhonePe)" className="h-10 flex-1 rounded-xl border border-line bg-raised px-3 text-[13px]" />
            <Button size="sm" variant="ghost" loading={busy === "note"} onClick={() => patch({ adminNote: note }, "note")}>Save</Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {(o.status === "payment_submitted" || o.status === "awaiting_payment") && (
              <Button size="sm" variant="gold" loading={busy === "confirmed"} onClick={() => patch({ status: "confirmed" }, "confirmed")}>
                <Check className="size-3.5" /> Confirm payment
              </Button>
            )}
            {o.status === "confirmed" && (
              <Button size="sm" variant="ghost" loading={busy === "checked in"} onClick={() => patch({ status: "checked_in" }, "checked in")}>
                <LogIn className="size-3.5" /> Check in
              </Button>
            )}
            {o.status !== "rejected" && o.status !== "checked_in" && (
              <Button
                size="sm"
                variant="danger"
                loading={busy === "rejected"}
                onClick={() => {
                  const reason = prompt("Reason the guest will see (optional):", "We couldn't verify the payment.");
                  if (reason === null) return;
                  patch({ status: "rejected", reason }, "rejected");
                }}
              >
                <X className="size-3.5" /> Reject
              </Button>
            )}
            {o.status === "confirmed" && (
              <Button size="sm" variant="ghost" loading={busy === "refunded"} onClick={() => confirm("Mark as refunded?") && patch({ status: "refunded" }, "refunded")}>
                Refunded
              </Button>
            )}
            {(o.status === "awaiting_payment" || o.status === "payment_submitted") && (
              <Button size="sm" variant="ghost" loading={busy === "cancelled"} onClick={() => confirm("Cancel this booking?") && patch({ status: "cancelled" }, "cancelled")}>
                <Ban className="size-3.5" /> Cancel
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

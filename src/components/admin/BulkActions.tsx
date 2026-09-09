"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2, Clock } from "lucide-react";

/**
 * Sits above the guestlist table. Acts on every id handed to it, which is
 * the currently filtered page — approving a whole night in one click.
 */
export function BulkActions({ ids }: { ids: string[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  if (!ids.length) return null;

  async function run(status: "approved" | "rejected" | "waitlisted") {
    const verb = status === "approved" ? "Approve" : status === "rejected" ? "Decline" : "Waitlist";
    if (!confirm(`${verb} all ${ids.length} shown ${ids.length === 1 ? "application" : "applications"}?`))
      return;

    setBusy(status);
    setResult(null);
    try {
      const res = await fetch("/api/admin/bookings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "That didn't go through.");
      setResult(`${data.updated} updated`);
      router.refresh();
    } catch (e) {
      setResult((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const Btn = ({
    status,
    Icon,
    label,
    tone,
  }: {
    status: "approved" | "rejected" | "waitlisted";
    Icon: typeof Check;
    label: string;
    tone: string;
  }) => (
    <button
      onClick={() => run(status)}
      disabled={busy !== null}
      className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold disabled:opacity-50 ${tone}`}
    >
      {busy === status ? <Loader2 className="size-3.5 animate-spin" /> : <Icon className="size-3.5" />}
      {label}
    </button>
  );

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
      <span className="mr-1 text-[13px] text-muted">
        {ids.length} shown
      </span>
      <Btn status="approved" Icon={Check} label="Approve all" tone="bg-red text-white" />
      <Btn status="waitlisted" Icon={Clock} label="Waitlist all" tone="bg-raised text-text" />
      <Btn status="rejected" Icon={X} label="Decline all" tone="bg-raised text-text" />

      <AnimatePresence>
        {result && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12.5px] text-muted"
          >
            {result}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Result = {
  code: string; status: string; guestName: string; totalGuests: number;
  femaleCount: number; maleCount: number; eventTitle: string; clubName: string;
  id: string; guestPhone: string;
} | null;

export function DoorScanner() {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result>(null);
  const [miss, setMiss] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 4) return;
    setBusy(true);
    setMiss(false);
    try {
      const r = await fetch(`/api/door/${c}`);
      if (r.status === 404) { setRes(null); setMiss(true); return; }
      setRes(await r.json());
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!res) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/bookings/${res.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "checked_in" }),
      });
      if (!r.ok) throw new Error("Check-in failed");
      setRes({ ...res, status: "checked_in" });
      toast(`${res.guestName} checked in`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(false);
    }
  }

  const ok = res?.status === "approved" || res?.status === "checked_in";

  return (
    <div className="mt-5">
      <form onSubmit={lookup} className="flex gap-2.5">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          autoCapitalize="characters"
          className="h-14 flex-1 rounded-2xl border border-line bg-raised px-4 text-center font-display text-[24px] font-bold tracking-[0.18em] placeholder:text-faint placeholder:tracking-[0.18em] focus:border-red/60"
        />
        <Button type="submit" size="lg" loading={busy} aria-label="Look up code">
          <Search className="size-4" />
        </Button>
      </form>

      <AnimatePresence mode="wait">
        {miss && (
          <motion.p
            key="miss"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[14px] text-muted"
          >
            No pass with that code.
          </motion.p>
        )}

        {res && (
          <motion.div
            key={res.code + res.status}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className={
              "mt-5 rounded-[22px] border p-5 " +
              (ok ? "border-gold/45 bg-gold/[0.07]" : "border-red/40 bg-red/[0.07]")
            }
          >
            <div className={"flex items-center gap-2 text-[13px] font-semibold " + (ok ? "text-gold" : "text-red-hot")}>
              {ok ? <Check className="size-4" /> : <X className="size-4" />}
              {res.status === "checked_in" ? "Already checked in" : ok ? "On the list" : `Not approved — ${res.status}`}
            </div>

            <p className="mt-2.5 font-display text-[24px] font-extrabold tracking-tight">{res.guestName}</p>
            <p className="mt-1 text-[13px] text-muted">
              {res.totalGuests} guest{res.totalGuests > 1 ? "s" : ""} ({res.femaleCount}F / {res.maleCount}M) ·{" "}
              {res.guestPhone}
            </p>
            <p className="mt-0.5 text-[12.5px] text-faint">{res.eventTitle} · {res.clubName}</p>

            {res.status === "approved" && (
              <Button size="lg" full className="mt-4" variant="gold" loading={busy} onClick={checkIn}>
                Check in {res.totalGuests} guest{res.totalGuests > 1 ? "s" : ""}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Sparkles, CalendarPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import type { DbHealth } from "@/db/health";

/** Shows on Admin → Overview whenever the database is missing tables or content. */
export function SetupPanel({ health }: { health: DbHealth }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(action: "upgrade" | "events" | "nights") {
    setBusy(action);
    try {
      const res = await fetch("/api/admin/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That didn't work");
      toast(data.message);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(null);
    }
  }

  if (!health.reachable) {
    return (
      <div className="mt-4 rounded-[18px] border border-red/40 bg-red/[0.07] p-4 text-[13px]">
        <p className="flex items-center gap-2 font-semibold text-red-hot"><AlertTriangle className="size-4" /> Can&apos;t reach the database</p>
        <p className="mt-1 text-muted">{health.error}. Check DATABASE_URL in your environment.</p>
      </div>
    );
  }

  const needsUpgrade = health.missing.length > 0;
  return (
    <div className="mt-4 space-y-3 rounded-[18px] border border-gold/35 bg-gold/[0.06] p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-gold"><AlertTriangle className="size-4" /> Finish setting up</p>
      {needsUpgrade && (
        <Row text={`The database is missing ${health.missing.length} table(s) the new features need. This adds them — existing bookings are untouched.`}>
          <Button size="sm" variant="gold" loading={busy === "upgrade"} onClick={() => run("upgrade")}><Database className="size-3.5" /> Set up database</Button>
        </Row>
      )}
      {!needsUpgrade && health.upcomingEvents === 0 && (
        <Row text="No upcoming events. Load the 15 Navratri 2026 Dandiya & Garba events (Delhi, Gurugram, Noida) and the Dandiya popup.">
          <Button size="sm" variant="gold" loading={busy === "events"} onClick={() => run("events")}><Sparkles className="size-3.5" /> Load Navratri events</Button>
        </Row>
      )}
      {!needsUpgrade && health.upcomingNights === 0 && (
        <Row text="No upcoming club nights — the Nights page is empty. Add real nights in Nights, or generate the next 2 weeks from the night templates at your clubs.">
          <Button size="sm" variant="ghost" loading={busy === "nights"} onClick={() => run("nights")}><CalendarPlus className="size-3.5" /> Add next 2 weeks</Button>
        </Row>
      )}
    </div>
  );
}

function Row({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <p className="min-w-[220px] flex-1 text-[13px] leading-relaxed text-muted">{text}</p>
      {children}
    </div>
  );
}

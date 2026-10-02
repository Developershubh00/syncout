"use client";
import { useEffect, useState } from "react";

/** Re-renders every `ms` so countdowns stay live. Starts null to keep server and client HTML identical. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function timeLeft(ms: number) {
  if (ms <= 0) return "0m";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

/** "Early bird ends in 1d 4h" — renders nothing until mounted, and nothing once it's over. */
export function Countdown({ until, prefix, className }: { until: string; prefix: string; className?: string }) {
  const now = useNow(1000);
  if (now === null) return null;
  const left = new Date(until).getTime() - now;
  if (left <= 0) return null;
  return (
    <span className={className}>
      {prefix} <b className="tabular-nums">{timeLeft(left)}</b>
    </span>
  );
}

/** A whole chip that only appears while the countdown is live. */
export function CountdownChip({ until, prefix, className, icon }: { until: string; prefix: string; className?: string; icon?: React.ReactNode }) {
  const now = useNow(1000);
  if (now === null) return null;
  const left = new Date(until).getTime() - now;
  if (left <= 0) return null;
  return (
    <p className={className}>
      {icon}
      <span>
        {prefix} <b className="tabular-nums">{timeLeft(left)}</b>
      </span>
    </p>
  );
}

"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

type Night = {
  slug: string;
  title: string;
  poster: string | null;
  startsAt: string | Date;
  musicType: string | null;
  clubName: string;
  clubArea: string;
};

/** Milliseconds until today's 18:00 IST cutoff, or tomorrow's once it passes. */
function msToCutoff(hour: number) {
  const now = new Date();
  // Work in IST regardless of where the browser is.
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
  const target = new Date(ist);
  target.setHours(hour, 0, 0, 0);
  if (ist >= target) target.setDate(target.getDate() + 1);
  return target.getTime() - ist.getTime();
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-[74px] rounded-xl border border-line bg-ink/60 px-3 py-2.5 text-center">
      <p className="font-display text-[26px] font-extrabold leading-none tabular-nums">
        {String(value).padStart(2, "0")}
      </p>
      <p className="mt-1 text-[11px] text-muted">{label}</p>
    </div>
  );
}

export function DesktopHero({
  cutoffHour = 18,
  featured,
  nightCount,
}: {
  cutoffHour?: number;
  featured?: Night | null;
  nightCount: number;
}) {
  const [ms, setMs] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setMs(msToCutoff(cutoffHour));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [cutoffHour]);

  const h = ms === null ? 0 : Math.floor(ms / 3_600_000);
  const m = ms === null ? 0 : Math.floor((ms % 3_600_000) / 60_000);
  const s = ms === null ? 0 : Math.floor((ms % 60_000) / 1000);

  const label = `${cutoffHour > 12 ? cutoffHour - 12 : cutoffHour}:00 ${cutoffHour >= 12 ? "PM" : "AM"}`;

  return (
    <section className="mb-10 hidden grid-cols-[1fr_1fr] gap-5 lg:grid">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-sheet border border-line bg-surface p-9"
      >
        <p className="text-[13px] font-semibold text-red">
          Tonight&apos;s list closes at {label}
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[44px] font-extrabold leading-[1.05] tracking-tight">
          Free entry, food and drinks on us.
        </h1>
        <p className="mt-4 max-w-[46ch] text-[14.5px] leading-relaxed text-muted">
          Get approved on the SyncOut list and the night is covered — entry, starters
          and house drinks. You just have to turn up.
        </p>

        <div className="mt-7 flex items-center gap-2.5">
          <Unit value={h} label="hours" />
          <Unit value={m} label="minutes" />
          <Unit value={s} label="seconds" />
          <span className="ml-2 max-w-[14ch] text-[13px] leading-snug text-muted">
            left to make tonight&apos;s list
          </span>
        </div>

        <Link
          href="/nights"
          className="mt-7 inline-flex h-12 items-center rounded-xl bg-red px-6 text-[14.5px] font-semibold text-white transition-colors hover:bg-red-hot"
        >
          See tonight&apos;s nights
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-sheet border border-line bg-raised"
      >
        {featured?.poster && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${featured.poster})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />

        <div className="relative flex h-full min-h-[330px] flex-col p-7">
          <div className="flex items-start justify-between">
            <span className="rounded-lg bg-red px-2.5 py-1 text-[12px] font-semibold text-white">
              Tonight
            </span>
            <span className="rounded-lg border border-line bg-ink/70 px-3 py-1 text-[12px] text-muted">
              {nightCount} {nightCount === 1 ? "night" : "nights"} taking applications
            </span>
          </div>

          {featured ? (
            <Link href={`/nights/${featured.slug}`} className="mt-auto block">
              <p className="font-display text-[27px] font-extrabold leading-tight tracking-tight">
                {featured.title}
              </p>
              <p className="mt-1.5 text-[14px] text-muted">
                {featured.clubName} · {featured.clubArea}
                {featured.musicType ? ` · ${featured.musicType}` : ""}
              </p>
            </Link>
          ) : (
            <p className="mt-auto text-[14px] text-muted">
              Tonight&apos;s line-up goes up by 2 PM.
            </p>
          )}
        </div>
      </motion.div>
    </section>
  );
}

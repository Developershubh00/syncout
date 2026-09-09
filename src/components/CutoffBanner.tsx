"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

/** Milliseconds until the next 6 PM IST. */
function msToCutoff(hour = 18) {
  const now = new Date();
  const ist = new Date(now.getTime() + (330 + now.getTimezoneOffset()) * 60000);
  const target = new Date(ist);
  target.setHours(hour, 0, 0, 0);
  if (ist.getTime() >= target.getTime()) target.setDate(target.getDate() + 1);
  return { ms: target.getTime() - ist.getTime(), passed: ist.getHours() >= hour };
}

export function CutoffBanner() {
  const [state, setState] = useState<{ h: number; m: number; s: number; passed: boolean } | null>(null);

  useEffect(() => {
    const tick = () => {
      const { ms, passed } = msToCutoff();
      setState({
        h: Math.floor(ms / 3600e3),
        m: Math.floor((ms % 3600e3) / 60000),
        s: Math.floor((ms % 60000) / 1000),
        passed,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section className="px-4 pt-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[22px] border border-line bg-surface p-5"
      >
        <div className="absolute -right-10 -top-14 size-44 rounded-full bg-red/18 blur-3xl" />

        <p className="text-[12.5px] font-semibold text-red">
          {state?.passed ? "Tonight's list is printed" : "Tonight's list closes at 6 PM"}
        </p>

        <h1 className="mt-2 font-display text-[30px] font-extrabold leading-[1.05] tracking-tight">
          {state?.passed ? (
            <>Apply now for<br />tomorrow night.</>
          ) : (
            <>Free entry, food<br />and drinks on us.</>
          )}
        </h1>

        <p className="mt-2.5 max-w-[30ch] text-[13.5px] leading-relaxed text-muted">
          Get approved on the SyncOut list and the night is covered — entry, starters and house
          drinks. You just have to turn up.
        </p>

        {state && (
          <div className="mt-4 flex items-center gap-2.5">
            <div className="flex items-baseline gap-1 rounded-xl border border-line bg-raised px-3 py-2 font-display text-[19px] font-bold tabular-nums">
              {pad(state.h)}<span className="text-[13px] text-faint">h</span>
              <span className="mx-0.5 text-faint">:</span>
              {pad(state.m)}<span className="text-[13px] text-faint">m</span>
              <span className="mx-0.5 text-faint">:</span>
              {pad(state.s)}<span className="text-[13px] text-faint">s</span>
            </div>
            <span className="text-[12px] leading-tight text-muted">
              {state.passed ? "until tomorrow's\nlist opens" : "left to make\ntonight's list"}
            </span>
          </div>
        )}

        <Link
          href="/nights"
          className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red text-[15px] font-semibold transition-transform active:scale-[0.98]"
        >
          See tonight&apos;s nights
          <ArrowRight className="size-4" />
        </Link>
      </motion.div>
    </section>
  );
}

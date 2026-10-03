"use client";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Search, Compass } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

/** Friendly, animated 404 for people who just hit a dead link. */
export function NotFoundView() {
  const reduce = useReducedMotion();
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-10 size-72 rounded-full bg-[#ff2bd6]/14 blur-3xl" />
        <div className="absolute -right-20 bottom-8 size-72 rounded-full bg-[#f2c14e]/10 blur-3xl" />
        {!reduce &&
          [...Array(5)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute block size-2 rounded-full bg-white/15"
              style={{ left: `${12 + i * 18}%`, top: `${20 + (i % 3) * 22}%` }}
              animate={{ y: [0, -14, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
            />
          ))}
      </div>

      <div className="relative">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }} className="mx-auto w-fit">
          <LogoMark width={96} mood="sad" />
        </motion.div>

        <motion.div
          className="mt-6 flex items-center justify-center gap-1 font-display text-[84px] font-extrabold leading-none tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <span className="bg-gradient-to-br from-[#ff2bd6] to-[#e4113c] bg-clip-text text-transparent">4</span>
          <motion.span animate={reduce ? undefined : { rotate: [0, -8, 8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="bg-gradient-to-br from-[#e4113c] to-[#ff8a00] bg-clip-text text-transparent">
            0
          </motion.span>
          <span className="bg-gradient-to-br from-[#ff8a00] to-[#f2c14e] bg-clip-text text-transparent">4</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 font-display text-[22px] font-extrabold tracking-tight">
          This page left early
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mx-auto mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-muted">
          The link is dead or the night has passed. The rest of the city is still open.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] px-6 text-[15px] font-semibold text-white shadow-[0_14px_36px_-14px_rgba(228,17,60,.9)]">
            <Home className="size-4" /> Back to tonight
          </Link>
          <Link href="/events" className="inline-flex h-12 items-center gap-2 rounded-full bg-raised px-5 text-[14px] font-semibold"><Compass className="size-4" /> Events</Link>
          <Link href="/search" className="inline-flex h-12 items-center gap-2 rounded-full bg-raised px-5 text-[14px] font-semibold"><Search className="size-4" /> Search</Link>
        </motion.div>
      </div>
    </div>
  );
}

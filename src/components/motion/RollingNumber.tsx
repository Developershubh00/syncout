"use client";
import { AnimatePresence, motion } from "framer-motion";

/** Each digit rolls up when it changes — for countdowns. */
export function RollingNumber({ value, pad = 2, className }: { value: number; pad?: number; className?: string }) {
  const digits = String(value).padStart(pad, "0").split("");
  return (
    <span className={"inline-flex tabular-nums " + (className ?? "")}>
      {digits.map((d, i) => (
        <span key={i} className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={d}
              className="absolute inset-0 text-center"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
            >
              {d}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

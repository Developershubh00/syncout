"use client";
import { motion, useReducedMotion } from "framer-motion";
import { Disc3 } from "lucide-react";

/** An endless, gently scrolling line of names — transform-only, pauses for reduced motion. */
export function Marquee({ items, label }: { items: string[]; label: string }) {
  const reduce = useReducedMotion();
  if (items.length < 4) return null;
  const row = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((name, i) => (
        <span key={`${name}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-[13px] font-semibold text-white/70">
          <Disc3 className="size-3.5 text-red" strokeWidth={2.2} />
          {name}
        </span>
      ))}
    </div>
  );
  return (
    <div className="relative mt-6 overflow-hidden border-y border-line/70 py-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <p className="sr-only">{label}</p>
      <motion.div
        className="flex w-max"
        animate={reduce ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: Math.max(24, items.length * 2.2), ease: "linear", repeat: Infinity }}
      >
        {row}
        {row}
      </motion.div>
    </div>
  );
}

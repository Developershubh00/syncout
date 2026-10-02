"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Mood } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

/** The guide: a glowing orb with eyes. `look` is a unit-ish vector toward what it's watching. */
export function Orb({ size = 56, mood = "idle", look = { x: 0, y: 0 }, className }: { size?: number; mood?: Mood; look?: { x: number; y: number }; className?: string }) {
  const reduce = useReducedMotion();
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (reduce) return;
    let t: ReturnType<typeof setTimeout>;
    let alive = true;
    const loop = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => setBlink(false), 140);
        loop();
      }, 2200 + Math.random() * 3200);
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduce]);

  const travel = size * 0.085;
  const ew = size * 0.11;
  const eh = size * 0.25;
  const happy = mood === "happy";
  const sad = mood === "sad";

  return (
    <span className={cn("orb", happy && "orb--happy", sad && "orb--sad", className)} style={{ width: size, height: size }}>
      <span className="orb-rim" />
      <span className="orb-rim orb-rim-2" />
      <span className="orb-core" />
      <span className="orb-shine" />
      <span className="absolute inset-0 grid place-items-center">
        <AnimatePresence initial={false} mode="popLayout">
          {happy ? (
            <motion.svg key="happy" viewBox="0 0 40 20" width={size * 0.5} height={size * 0.25} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <path d="M5 14Q10 4 15 14M25 14Q30 4 35 14" fill="none" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" />
            </motion.svg>
          ) : (
            <motion.span
              key="eyes"
              className="flex items-center"
              style={{ gap: size * 0.13 }}
              animate={{ x: look.x * travel, y: look.y * travel + (sad ? size * 0.05 : 0), scaleY: blink ? 0.12 : sad ? 0.62 : 1 }}
              transition={{ scaleY: { duration: 0.12 }, default: { type: "spring", damping: 18, stiffness: 260 } }}
            >
              {[0, 1].map((i) => (
                <motion.span
                  key={i}
                  className="block rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,.7)]"
                  style={{ width: ew, height: eh }}
                  animate={{ rotate: sad ? (i === 0 ? 18 : -18) : 0 }}
                />
              ))}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}

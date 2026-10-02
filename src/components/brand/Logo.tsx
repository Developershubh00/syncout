"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MARK_PATH, MARK_VIEWBOX, EYES, GRADIENT } from "./mark";
import { cn } from "@/lib/utils";

export type Mood = "idle" | "happy" | "sad";

/** Blinks every few seconds and glances around now and then. Pure decoration. */
function useAlive(enabled: boolean) {
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let alive = true;
    const blinkLoop = () =>
      timers.push(
        setTimeout(() => {
          if (!alive) return;
          setBlink(true);
          timers.push(setTimeout(() => setBlink(false), 150));
          blinkLoop();
        }, 2600 + Math.random() * 3400)
      );
    const lookLoop = () =>
      timers.push(
        setTimeout(() => {
          if (!alive) return;
          setLook(Math.random() < 0.5 ? -2.6 : 2.6);
          timers.push(setTimeout(() => setLook(0), 1000));
          lookLoop();
        }, 4500 + Math.random() * 4500)
      );
    blinkLoop();
    lookLoop();
    return () => {
      alive = false;
      timers.forEach(clearTimeout);
    };
  }, [enabled]);
  return { blink, look };
}

/** The ∞ with eyes. */
export function LogoMark({
  width = 44,
  mood = "idle",
  eyeColor = "#fff",
  hello = false,
  className,
}: {
  width?: number;
  mood?: Mood;
  eyeColor?: string;
  hello?: boolean;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const { blink, look } = useAlive(!reduce);
  const [waking, setWaking] = useState(hello && !reduce);
  useEffect(() => {
    if (!waking) return;
    const t = setTimeout(() => setWaking(false), 900);
    return () => clearTimeout(t);
  }, [waking]);
  const happy = mood === "happy";
  const sad = mood === "sad";

  return (
    <svg viewBox={MARK_VIEWBOX} width={width} height={width / 2} className={cn("shrink-0 overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={`m${id}`} x1="0" y1="0" x2="1" y2="0">
          {GRADIENT.map((s) => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
      <motion.path
        d={MARK_PATH}
        fill="none"
        stroke={`url(#m${id})`}
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={happy ? { scale: [1, 1.08, 1] } : sad ? { y: 1.5 } : { scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{ originX: "50%", originY: "50%" }}
      />
      <AnimatePresence initial={false} mode="popLayout">
        {happy ? (
          <motion.g key="happy" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {EYES.map((e) => (
              <path key={e.cx} d={`M${e.cx - 5} 33Q${e.cx} 24 ${e.cx + 5} 33`} fill="none" stroke={eyeColor} strokeWidth={4} strokeLinecap="round" />
            ))}
          </motion.g>
        ) : (
          <motion.g
            key="eyes"
            initial={waking ? { scale: 0 } : false}
            animate={{ x: look, y: sad ? 2.5 : 0, scale: 1, scaleY: blink || waking ? [1, 0.15, 1] : sad ? 0.65 : 1 }}
            transition={{ scale: { type: "spring", damping: 9, stiffness: 320 }, scaleY: { duration: 0.16 }, default: { type: "spring", damping: 16, stiffness: 220 } }}
            style={{ originX: "50%", originY: "50%" }}
          >
            {EYES.map((e, i) => (
              <motion.rect
                key={e.cx}
                x={e.cx - 3.2}
                y={23}
                width={6.4}
                height={14}
                rx={3.2}
                fill={eyeColor}
                animate={{ rotate: sad ? (i === 0 ? 16 : -16) : 0 }}
                style={{ originX: "50%", originY: "50%" }}
              />
            ))}
          </motion.g>
        )}
      </AnimatePresence>
    </svg>
  );
}

const SIZES = {
  xs: { mark: 30, text: "text-[17px]", gap: "gap-1.5" },
  sm: { mark: 38, text: "text-[21px]", gap: "gap-2" },
  md: { mark: 46, text: "text-[25px]", gap: "gap-2.5" },
  lg: { mark: 92, text: "text-[50px]", gap: "gap-4" },
} as const;

/** Mark + wordmark. Says hello once when it appears, squints happily when tapped. */
export function Logo({ size = "sm", hello = true, light = false, className }: { size?: keyof typeof SIZES; hello?: boolean; light?: boolean; className?: string }) {
  const s = SIZES[size];
  const reduce = useReducedMotion();
  const [mood, setMood] = useState<Mood>("idle");
  const [wave, setWave] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // After the first-visit splash (if it's showing), wave hello.
  useEffect(() => {
    if (!hello || reduce) return;
    const splash = !document.documentElement.classList.contains("no-splash") && document.querySelector(".splash");
    const t = setTimeout(() => setWave(true), splash ? 2300 : 250);
    return () => clearTimeout(t);
  }, [hello, reduce]);

  const tap = () => {
    setMood("happy");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMood("idle"), 1100);
  };

  return (
    <span className={cn("inline-flex items-center", s.gap, className)} onPointerDown={tap}>
      <LogoMark width={s.mark} mood={mood} hello={wave} eyeColor={light ? "#111" : "#fff"} />
      <span className={cn("font-display font-extrabold leading-none tracking-[-0.045em]", s.text, light ? "text-[#111]" : "text-text")} aria-label="SyncOut">
        {"syncout".split("").map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            className={cn("inline-block", i >= 4 && (light ? "text-[#e4113c]" : "text-red"))}
            animate={wave && !reduce ? { y: [0, -5, 0] } : { y: 0 }}
            transition={{ duration: 0.42, delay: 0.25 + i * 0.05, ease: "easeOut" }}
          >
            {ch}
          </motion.span>
        ))}
      </span>
    </span>
  );
}

"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo } from "react";
import { Check } from "lucide-react";

const COLORS = ["#e4113c", "#f2c14e", "#ff3b5c", "#ffffff", "#00e5ff", "#ff2bd6", "#ff8a00"];

/**
 * Full-screen "thank you" moment after a booking: a burst, a ring that draws
 * itself, confetti, then it hands off (onDone) — usually to the pass/ticket.
 */
export function ThankYouSplash({
  open,
  title,
  body,
  code,
  festive = true,
  autoMs = 2600,
  onDone,
}: {
  open: boolean;
  title: string;
  body?: string;
  code?: string;
  festive?: boolean;
  autoMs?: number;
  onDone?: () => void;
}) {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => {
        const a = (i / 44) * Math.PI * 2 + Math.random() * 0.5;
        const d = 130 + Math.random() * 230;
        return {
          x: Math.cos(a) * d,
          y: Math.sin(a) * d - 80,
          r: Math.random() * 600 - 300,
          c: COLORS[i % COLORS.length],
          w: Math.random() > 0.5 ? 11 : 6,
          h: Math.random() > 0.5 ? 4 : 6,
          delay: Math.random() * 0.18,
        };
      }),
    // a fresh burst each time it opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open]
  );

  useEffect(() => {
    if (!open || !onDone) return;
    const t = setTimeout(onDone, autoMs);
    return () => clearTimeout(t);
  }, [open, onDone, autoMs]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[95] grid place-items-center overflow-hidden bg-ink/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDone}
        >
          <motion.div
            className="absolute size-[130vmax] rounded-full"
            style={{
              background: festive
                ? "radial-gradient(circle, rgba(255,43,214,.32), rgba(255,138,0,.16) 30%, rgba(228,17,60,.08) 45%, transparent 62%)"
                : "radial-gradient(circle, rgba(242,193,78,.22), rgba(228,17,60,.10) 35%, transparent 60%)",
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />

          {!reduce &&
            bits.map((b, i) => (
              <motion.span
                key={i}
                className="absolute left-1/2 top-1/2 rounded-[2px]"
                style={{ width: b.w, height: b.h, background: b.c }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{ x: b.x, y: [0, b.y, b.y + 260], opacity: [1, 1, 0], rotate: b.r }}
                transition={{ duration: 1.9, delay: 0.25 + b.delay, ease: "easeOut", times: [0, 0.42, 1] }}
              />
            ))}

          <div className="relative px-8 text-center" onClick={(e) => e.stopPropagation()}>
            {festive && !reduce && (
              <div className="pointer-events-none absolute left-1/2 top-[-34px] h-20 w-40 -translate-x-1/2">
                {[-1, 1].map((dir) => (
                  <motion.span
                    key={dir}
                    className="absolute left-1/2 top-1/2 h-[7px] w-[130px] origin-center rounded-full"
                    style={{
                      marginLeft: -65,
                      background: "repeating-linear-gradient(90deg,#f2c14e 0 12px,#e4113c 12px 20px,#ff2bd6 20px 28px)",
                    }}
                    initial={{ rotate: dir * 70, opacity: 0, y: -30 }}
                    animate={{ rotate: [dir * 70, dir * 24, dir * 32, dir * 26], opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
                  />
                ))}
              </div>
            )}

            <div className="relative mx-auto grid size-[96px] place-items-center">
              <motion.span
                className="absolute inset-0 rounded-full bg-gold/15"
                initial={{ scale: 0.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", damping: 16, stiffness: 280 }}
              />
              <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                <motion.circle
                  cx="50" cy="50" r="46" fill="none" stroke="var(--color-gold)" strokeWidth="4" strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.38, type: "spring", damping: 12, stiffness: 400 }}
              >
                <Check className="size-11 text-gold" strokeWidth={2.8} />
              </motion.span>
            </div>

            <motion.p
              className="mt-6 font-display text-[29px] font-extrabold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {title}
            </motion.p>
            {body && (
              <motion.p
                className="mx-auto mt-2.5 max-w-[32ch] text-[14px] leading-relaxed text-muted"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
              >
                {body}
              </motion.p>
            )}
            {code && (
              <motion.p
                className="mt-5 inline-block rounded-xl border border-gold/40 bg-gold/[0.08] px-4 py-2 font-display text-[22px] font-extrabold tracking-[0.18em] text-gold"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.55, type: "spring", damping: 18, stiffness: 300 }}
              >
                {code}
              </motion.p>
            )}
            <div className="mx-auto mt-7 h-1 w-40 overflow-hidden rounded-full bg-line">
              <motion.div
                className="h-full bg-red"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: autoMs / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X, Clock, PartyPopper } from "lucide-react";
import { useEffect } from "react";

export type PopupKind = "approved" | "rejected" | "waitlisted" | "submitted";

export type PopupPayload = {
  kind: PopupKind;
  title: string;
  body?: string;
  code?: string;
  cta?: { label: string; href: string };
};

const look: Record<PopupKind, { Icon: typeof Check; ring: string; tint: string }> = {
  approved: { Icon: Check, ring: "#22c55e", tint: "rgba(34,197,94,0.16)" },
  submitted: { Icon: Clock, ring: "var(--color-gold)", tint: "rgba(242,193,78,0.16)" },
  waitlisted: { Icon: Clock, ring: "var(--color-gold)", tint: "rgba(242,193,78,0.16)" },
  rejected: { Icon: X, ring: "var(--color-red)", tint: "rgba(228,17,60,0.16)" },
};

export function StatusPopup({ data, onClose }: { data: PopupPayload | null; onClose: () => void }) {
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(onClose, data.kind === "approved" ? 6000 : 4500);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", esc);
    };
  }, [data, onClose]);

  const cfg = data ? look[data.kind] : null;
  const Icon = data?.kind === "approved" ? PartyPopper : cfg?.Icon ?? Check;

  return (
    <AnimatePresence>
      {data && cfg && (
        <motion.div
          className="fixed inset-0 z-[90] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute inset-0 bg-ink/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="alertdialog"
            aria-live="assertive"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[340px] overflow-hidden rounded-sheet border border-line bg-surface p-7 text-center shadow-2xl"
            initial={{ opacity: 0, y: 26, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
          >
            <div className="relative mx-auto grid size-[74px] place-items-center">
              {/* the ring draws itself, then the mark lands */}
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ background: cfg.tint }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", damping: 18, stiffness: 300 }}
              />
              <motion.svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={cfg.ring}
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </motion.svg>
              <motion.span
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.32, type: "spring", damping: 14, stiffness: 420 }}
              >
                <Icon className="size-8" style={{ color: cfg.ring }} strokeWidth={2.6} />
              </motion.span>
            </div>

            <motion.p
              className="mt-5 font-display text-[21px] font-extrabold leading-tight"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
            >
              {data.title}
            </motion.p>

            {data.body && (
              <motion.p
                className="mx-auto mt-2 max-w-[30ch] text-[13.5px] leading-relaxed text-muted"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {data.body}
              </motion.p>
            )}

            {data.code && (
              <motion.p
                className="mt-4 inline-block rounded-xl border border-line bg-raised px-4 py-2 font-mono text-[17px] font-semibold tracking-[0.18em]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.38, type: "spring", damping: 20, stiffness: 300 }}
              >
                {data.code}
              </motion.p>
            )}

            <div className="mt-6 flex gap-2">
              {data.cta && (
                <a
                  href={data.cta.href}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl bg-red text-[14px] font-semibold text-white"
                >
                  {data.cta.label}
                </a>
              )}
              <button
                onClick={onClose}
                className="h-11 flex-1 rounded-xl border border-line bg-raised text-[14px] font-semibold"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

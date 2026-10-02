"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ListChecks, Ticket, BellRing, ArrowRight } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { Orb } from "./Orb";

const SEEN = "so_intro_v1";
const SHOW_MS = 4600;

/**
 * First-time intro: the guide flies in from its corner, says hello and what
 * SyncOut does, then flies back. Once per device — and once more, by name,
 * after someone's first login. Never interrupts a shared booking link.
 */
export function Intro({ userId, name }: { userId?: string | null; name?: string | null }) {
  const path = usePathname();
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState(0);
  const key = userId ? `so_intro_u_${userId}` : SEEN;
  const first = name?.split(" ")[0];

  useEffect(() => {
    const blocked = new URLSearchParams(window.location.search).has("book") || /^\/(tickets|login|register|forgot|reset|passes\/)/.test(path);
    if (blocked) return;
    let seen = false;
    try {
      seen = Boolean(localStorage.getItem(key));
    } catch {}
    if (seen) return;
    const splash = document.querySelector(".splash") && !document.documentElement.classList.contains("no-splash");
    const t = setTimeout(() => setShow(true), splash ? 4850 : 700);
    return () => clearTimeout(t);
  }, [key, path]);

  useEffect(() => {
    if (!show) return;
    try {
      localStorage.setItem(key, "1");
      localStorage.setItem(SEEN, "1");
    } catch {}
    document.body.dataset.intro = "on";
    const t1 = setTimeout(() => setPhase(1), 1500);
    const t2 = setTimeout(() => setShow(false), SHOW_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      delete document.body.dataset.intro;
    };
  }, [show, key]);

  const lines = [
    { Icon: ListChecks, t: "Free guestlists", s: "Apply in seconds — confirmed by 6 PM" },
    { Icon: Ticket, t: "Dandiya & party tickets", s: "Book in the app, walk in with a QR" },
    { Icon: BellRing, t: "I'll keep you updated", s: "Confirmations, new drops and offers" },
  ];
  const greeting = userId ? `Hey ${first || "you"}! You're in.` : "Hey buddy! Welcome to SyncOut";

  return (
    <Portal>
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed inset-0 z-[95] flex flex-col items-center justify-center overflow-hidden bg-[#07070a]/92 px-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.15 } }}
            role="dialog"
            aria-label="Welcome to SyncOut"
          >
            <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[420px] -translate-x-1/2 rounded-full bg-[#ff2bd6]/18 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 right-[-80px] size-[360px] rounded-full bg-[#f2c14e]/12 blur-3xl" />

            <button
              onClick={() => setShow(false)}
              className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+14px)] flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white/85 backdrop-blur"
            >
              Skip <X className="size-3.5" />
            </button>

            {/* the guide flies in from its corner */}
            <motion.div
              initial={reduce ? { opacity: 0 } : { x: "40vw", y: "40vh", scale: 0.4, opacity: 0 }}
              animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { x: "40vw", y: "40vh", scale: 0.35, opacity: 0, transition: { duration: 0.45, ease: [0.4, 0, 1, 1] } }}
              transition={{ type: "spring", damping: 17, stiffness: 120 }}
            >
              <motion.div animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}>
                <Orb size={118} mood={phase === 0 ? "happy" : "idle"} look={{ x: 0, y: phase === 0 ? 0 : 0.45 }} />
              </motion.div>
            </motion.div>

            <motion.div
              className="relative mt-7 max-w-[340px] rounded-[26px] rounded-tl-lg border border-white/10 bg-white/[0.07] px-5 py-4 text-center"
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.55, type: "spring", damping: 20, stiffness: 220 }}
            >
              <p className="font-display text-[25px] font-extrabold leading-tight tracking-tight">
                {greeting.split(" ").map((w, i) => (
                  <span key={i}>
                    <motion.span className="inline-block" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 + i * 0.09 }}>
                      {w}
                    </motion.span>{" "}
                  </span>
                ))}
              </p>
              <motion.p className="mt-1 text-[13.5px] text-white/65" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
                {userId ? "Your tickets and passes live in Passes — and I'm right here if you need me." : "I'm your guide to the best nights in Delhi NCR."}
              </motion.p>
            </motion.div>

            <ul className="mt-5 w-full max-w-[340px] space-y-2.5">
              {lines.map(({ Icon, t, s }, i) => (
                <motion.li
                  key={t}
                  className="flex items-center gap-3 rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                  initial={{ opacity: 0, x: -24 }}
                  animate={phase >= 1 ? { opacity: 1, x: 0 } : { opacity: 0, x: -24 }}
                  transition={{ delay: i * 0.18, type: "spring", damping: 22, stiffness: 240 }}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#ff2bd6] to-[#e4113c]"><Icon className="size-[18px]" /></span>
                  <span className="min-w-0 text-left">
                    <span className="block text-[14px] font-semibold">{t}</span>
                    <span className="block text-[12px] text-white/55">{s}</span>
                  </span>
                </motion.li>
              ))}
            </ul>

            <motion.button
              onClick={() => setShow(false)}
              className="mt-6 flex h-[52px] w-full max-w-[340px] items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] text-[15px] font-bold shadow-[0_18px_40px_-16px_rgba(228,17,60,.9)]"
              initial={{ opacity: 0, y: 12 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ delay: 0.55 }}
              whileTap={{ scale: 0.97 }}
            >
              Let&apos;s go <ArrowRight className="size-4" />
            </motion.button>

            {/* how long until it leaves by itself */}
            <motion.span
              aria-hidden
              className="absolute bottom-[calc(env(safe-area-inset-bottom,0px)+18px)] h-1 w-24 origin-left rounded-full bg-white/25"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: SHOW_MS / 1000, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Orb } from "./Orb";
import { GuidePanel } from "./GuidePanel";
import type { Mood } from "@/components/brand/Logo";

/**
 * The floating guide. Watches your cursor (or last tap), cheers when you tap
 * something, sulks when you go back or close it — and opens a helper that can
 * hand you to a real person on WhatsApp.
 */
export function GuideFab({ whatsapp, name, signedIn }: { whatsapp: string; name?: string | null; signedIn: boolean }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const [look, setLook] = useState({ x: 0, y: 0 });
  const btn = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback((m: Mood, ms: number) => {
    setMood(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMood("idle"), ms);
  }, []);

  // Eyes follow the pointer.
  useEffect(() => {
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = btn.current?.getBoundingClientRect();
        if (!r) return;
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 240);
        setLook({ x: (dx / d) * k, y: (dy / d) * k });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, []);

  // Happy when you tap something; sad when you go back.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a, button, [role=button]");
      if (!el || btn.current?.contains(el)) return;
      flash("happy", 1100);
    };
    const onBack = () => flash("sad", 1500);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onBack);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onBack);
    };
  }, [flash]);

  const close = useCallback(() => {
    setOpen(false);
    flash("sad", 1400);
  }, [flash]);

  if (path.startsWith("/tickets") || path.startsWith("/login") || path.startsWith("/register")) return null;
  // Event and night pages have a sticky Book button at the bottom — sit above it.
  const lifted = /^\/(events|nights)\/[^/]+$/.test(path) && !path.startsWith("/events/in/");

  return (
    <>
      <motion.button
        ref={btn}
        onClick={() => {
          setOpen(true);
          flash("happy", 900);
        }}
        aria-label="Open the SyncOut guide"
        className="wa-fab fixed right-4 z-30 rounded-full"
        style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${lifted ? 170 : 106}px)` }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, y: mood === "happy" ? [0, -9, 0] : mood === "sad" ? 4 : 0 }}
        transition={{ scale: { type: "spring", damping: 12, stiffness: 260, delay: 0.6 }, y: { duration: 0.5 } }}
        whileTap={{ scale: 0.9 }}
      >
        <Orb size={58} mood={mood} look={look} />
      </motion.button>
      <GuidePanel open={open} onClose={close} whatsapp={whatsapp} name={name} signedIn={signedIn} mood={mood} look={look} />
    </>
  );
}

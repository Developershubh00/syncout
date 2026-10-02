"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Share, PlusSquare, X, Bell, Ticket, Zap } from "lucide-react";
import { usePwa } from "./PwaProvider";

const SNOOZE = "so:install:snooze";
const VISITS = "so:visits";

/**
 * Invites people to add SyncOut to their home screen — after a pause on a
 * first visit, sooner on a return visit, and not again for 5 days once
 * dismissed. iPhones get Safari's two-step instructions instead of a button.
 */
export function InstallPrompt() {
  const { canInstall, installed, ios, install } = usePwa();
  const path = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (installed || !(canInstall || ios)) return;
    try {
      if (Number(localStorage.getItem(SNOOZE) || 0) > Date.now()) return;
      if (!sessionStorage.getItem("so:counted")) {
        sessionStorage.setItem("so:counted", "1");
        localStorage.setItem(VISITS, String(Number(localStorage.getItem(VISITS) || 0) + 1));
      }
    } catch {
      return;
    }
    const visits = Number(localStorage.getItem(VISITS) || 1);
    const t = setTimeout(() => setShow(true), visits >= 2 ? 6000 : 25000);
    return () => clearTimeout(t);
  }, [canInstall, installed, ios]);

  const hidden = path.startsWith("/tickets") || path.startsWith("/passes/") || path.startsWith("/login") || path.startsWith("/register");

  function snooze() {
    setShow(false);
    try {
      localStorage.setItem(SNOOZE, String(Date.now() + 5 * 864e5));
    } catch {}
  }

  async function go() {
    const ok = await install();
    if (ok) setShow(false);
    else snooze();
  }

  return (
    <AnimatePresence>
      {show && !hidden && !installed && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 320 }}
          className="fixed inset-x-3 z-[70] mx-auto max-w-[420px] overflow-hidden rounded-[22px] border border-line bg-surface/95 p-4 shadow-2xl backdrop-blur-xl lg:inset-x-auto lg:right-6"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)" }}
          role="dialog"
          aria-label="Install the SyncOut app"
        >
          <button onClick={snooze} aria-label="Not now" className="absolute right-3 top-3 rounded-full p-1 text-faint active:bg-raised">
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="size-12 shrink-0 rounded-[14px]" />
            <div className="min-w-0 pr-5">
              <p className="font-display text-[17px] font-extrabold leading-tight">Get the SyncOut app</p>
              <ul className="mt-2 space-y-1 text-[12.5px] text-muted">
                <li className="flex items-center gap-1.5"><Bell className="size-3.5 text-gold" /> Instant alerts when you&apos;re approved</li>
                <li className="flex items-center gap-1.5"><Ticket className="size-3.5 text-gold" /> Passes &amp; tickets one tap away</li>
                <li className="flex items-center gap-1.5"><Zap className="size-3.5 text-gold" /> Free, tiny, no app store</li>
              </ul>
            </div>
          </div>
          {canInstall ? (
            <div className="mt-3.5 flex gap-2">
              <button onClick={go} className="h-11 flex-1 rounded-xl bg-red text-[14px] font-semibold text-white">Install</button>
              <button onClick={snooze} className="h-11 rounded-xl bg-raised px-4 text-[14px] font-semibold">Not now</button>
            </div>
          ) : (
            <p className="mt-3.5 flex flex-wrap items-center gap-1.5 rounded-xl bg-raised px-3 py-2.5 text-[12.5px] leading-relaxed">
              In Safari, tap <Share className="inline size-4 text-[#0a84ff]" /> <b>Share</b>, then
              <PlusSquare className="inline size-4" /> <b>Add to Home Screen</b>.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

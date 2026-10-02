"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Ticket, IndianRupee, ListChecks, X, BellRing } from "lucide-react";

type Ev = { kind: "order" | "payment" | "guestlist"; key: string; at: string; title: string; body: string; url: string };
const SEEN = "so_admin_seen";
const ICON = { order: Ticket, payment: IndianRupee, guestlist: ListChecks };

/**
 * Live pop-ups in the admin panel: a card (and a chime) for every new booking,
 * payment and guestlist request. Opening the app shows what came in while you
 * were away. Polls gently and slows down when the app is in the background.
 */
export function AdminLive() {
  const router = useRouter();
  const [items, setItems] = useState<Ev[]>([]);
  const [missed, setMissed] = useState(0);
  const after = useRef<string | null>(null);
  const seen = useRef(new Set<string>());
  const audio = useRef<AudioContext | null>(null);
  const unread = useRef(0);
  const baseTitle = useRef("");

  useEffect(() => {
    // Browsers only allow sound after a tap — unlock it on the first one.
    const unlock = () => {
      try {
        audio.current ??= new AudioContext();
        void audio.current.resume();
      } catch {}
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    baseTitle.current = document.title;
    let first = true;
    let timer: ReturnType<typeof setTimeout>;
    try {
      after.current = localStorage.getItem(SEEN) || new Date(Date.now() - 6 * 3600e3).toISOString();
    } catch {
      after.current = new Date(Date.now() - 3600e3).toISOString();
    }

    const chime = () => {
      const ctx = audio.current;
      if (!ctx || localStorage.getItem("so_admin_sound") === "off") return;
      const t = ctx.currentTime;
      [880, 1318.5].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t + i * 0.14);
        g.gain.exponentialRampToValueAtTime(0.22, t + i * 0.14 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(t + i * 0.14);
        o.stop(t + i * 0.14 + 0.4);
      });
    };

    const poll = async () => {
      try {
        const res = await fetch(`/api/admin/live?after=${encodeURIComponent(after.current!)}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { now: string; events: Ev[] };
          const fresh = data.events.filter((e) => !seen.current.has(e.key));
          fresh.forEach((e) => seen.current.add(e.key));
          after.current = data.now;
          try {
            localStorage.setItem(SEEN, data.now);
          } catch {}
          if (fresh.length) {
            if (first && fresh.length > 1) setMissed(fresh.length);
            setItems((cur) => [...fresh.slice(0, 3), ...cur].slice(0, 4));
            if (!first) {
              chime();
              navigator.vibrate?.([60, 40, 60]);
            }
            if (document.visibilityState !== "visible") {
              unread.current += fresh.length;
              document.title = `(${unread.current}) ${baseTitle.current}`;
            }
            router.refresh();
          }
        }
      } catch {}
      first = false;
      timer = setTimeout(poll, document.visibilityState === "visible" ? 12_000 : 45_000);
    };
    void poll();

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      unread.current = 0;
      document.title = baseTitle.current;
      clearTimeout(timer);
      void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  const close = (key: string) => setItems((cur) => cur.filter((e) => e.key !== key));

  return (
    <div className="pointer-events-none fixed inset-x-3 top-[calc(env(safe-area-inset-top,0px)+10px)] z-[65] flex flex-col items-end gap-2 lg:inset-x-auto lg:right-5 lg:w-[360px]">
      <AnimatePresence initial={false}>
        {missed > 1 && (
          <motion.button
            key="missed"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            onClick={() => setMissed(0)}
            className="pointer-events-auto flex w-full items-center gap-2 rounded-2xl border border-gold/40 bg-ink/95 px-3.5 py-2.5 text-left text-[13px] font-semibold text-gold shadow-xl backdrop-blur"
          >
            <BellRing className="size-4" /> {missed} new since you last checked
          </motion.button>
        )}
        {items.map((e) => (
          <Card key={e.key} e={e} onClose={() => close(e.key)} onOpen={() => { close(e.key); router.push(e.url); }} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Card({ e, onClose, onOpen }: { e: Ev; onClose: () => void; onOpen: () => void }) {
  const Icon = ICON[e.kind];
  useEffect(() => {
    const t = setTimeout(onClose, 15_000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-line bg-surface/95 p-3.5 shadow-2xl backdrop-blur"
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${e.kind === "payment" ? "bg-gold/15 text-gold" : e.kind === "order" ? "bg-[#ff2bd6]/15 text-[#ff6ad5]" : "bg-red/15 text-red-hot"}`}>
        <Icon className="size-[18px]" />
      </span>
      <button onClick={onOpen} className="min-w-0 flex-1 text-left">
        <p className="text-[13.5px] font-semibold">{e.title}</p>
        <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-snug text-muted">{e.body}</p>
      </button>
      <button onClick={onClose} aria-label="Dismiss" className="rounded-lg p-1 text-faint">
        <X className="size-4" />
      </button>
    </motion.div>
  );
}

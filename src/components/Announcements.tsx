"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { cityName } from "@/lib/cities";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string | null;
  image: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  kind: "popup" | "banner";
  audience: "everyone" | "signed_in" | "signed_out";
  theme: "festive" | "elegant";
  cities: string[];
};

const seenKey = (id: string) => `so:ann:${id}`;
const wasSeen = (id: string) => {
  try {
    return Boolean(localStorage.getItem(seenKey(id)));
  } catch {
    return true;
  }
};
const markSeen = (id: string) => {
  try {
    localStorage.setItem(seenKey(id), String(Date.now()));
  } catch {}
};
const forAudience = (a: AnnouncementItem, signedIn: boolean) =>
  a.audience === "everyone" || (a.audience === "signed_in" ? signedIn : !signedIn);

/** Where a popup would get in the way of someone mid-task. */
const QUIET = ["/events/", "/tickets", "/passes/", "/login", "/register", "/notifications", "/dandiya", "/search"];

function cityHref(base: string, slug: string) {
  if (base === "/dandiya" || base === "/events/in") return `${base}/${slug}`;
  return `${base}${base.includes("?") ? "&" : "?"}city=${slug}`;
}

/** Admin-managed popup (Admin → Announcements). Shows once per device. */
export function AnnouncementPopup({ items, signedIn }: { items: AnnouncementItem[]; signedIn: boolean }) {
  const path = usePathname();
  const [item, setItem] = useState<AnnouncementItem | null>(null);

  useEffect(() => {
    if (QUIET.some((q) => path.startsWith(q))) return;
    const next = items.find((a) => a.kind === "popup" && forAudience(a, signedIn) && !wasSeen(a.id));
    if (!next) return;
    const t = setTimeout(() => setItem(next), 1500);
    return () => clearTimeout(t);
  }, [items, signedIn, path]);

  const close = () => {
    if (item) markSeen(item.id);
    setItem(null);
  };

  const festive = item?.theme !== "elegant";

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="fixed inset-0 z-[85] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-ink/80 backdrop-blur-md" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.title}
            className={
              "relative w-full max-w-[400px] overflow-hidden rounded-[26px] border shadow-2xl " +
              (festive ? "border-[#ff2bd6]/35 bg-[#14061f]" : "border-gold/30 bg-surface")
            }
            initial={{ y: 40, scale: 0.92, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
          >
            <button onClick={close} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-full bg-ink/60 p-1.5 text-white backdrop-blur">
              <X className="size-4" />
            </button>

            {item.image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt="" className="size-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14061f] via-transparent to-transparent" />
                {festive && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1">
                    {["#f2c14e", "#ff2bd6", "#00e5ff", "#ff8a00", "#f2c14e"].map((c, i) => (
                      <motion.span
                        key={i}
                        className="block size-1.5 rounded-full"
                        style={{ background: c }}
                        animate={{ y: [0, -7, 0], opacity: [0.6, 1, 0.6] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-5 pt-4 text-center">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                <Sparkles className="size-3" /> {festive ? "Navratri special" : "Announcement"}
              </p>
              <h2 className={"mt-3 font-display text-[25px] font-extrabold leading-tight " + (festive ? "text-shimmer" : "")}>
                {item.title}
              </h2>
              {item.body && <p className="mx-auto mt-2 max-w-[34ch] text-[13.5px] leading-relaxed text-white/75">{item.body}</p>}

              {item.cities.length > 0 && item.ctaUrl && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {item.cities.map((c) => (
                    <Link
                      key={c}
                      href={cityHref(item.ctaUrl!, c)}
                      onClick={close}
                      className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold transition-colors hover:bg-white/10"
                    >
                      {cityName(c, true)}
                    </Link>
                  ))}
                </div>
              )}

              {item.ctaUrl && (
                <Link
                  href={item.ctaUrl}
                  onClick={close}
                  className={
                    "mt-5 flex h-12 items-center justify-center rounded-2xl text-[15px] font-semibold text-white " +
                    (festive ? "bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00]" : "bg-red")
                  }
                >
                  {item.ctaLabel || "Take a look"}
                </Link>
              )}
              <button onClick={close} className="mt-2.5 text-[12.5px] text-white/55">
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Thin dismissible strip for "banner" announcements. */
export function AnnouncementBanner({ items, signedIn }: { items: AnnouncementItem[]; signedIn: boolean }) {
  const [item, setItem] = useState<AnnouncementItem | null>(null);
  useEffect(() => {
    setItem(items.find((a) => a.kind === "banner" && forAudience(a, signedIn) && !wasSeen(a.id)) ?? null);
  }, [items, signedIn]);
  if (!item) return null;
  return (
    <div className="relative z-30 bg-gradient-to-r from-[#7b1fa2] via-[#e4113c] to-[#ff8a00] px-10 py-2 text-center text-[12.5px] font-semibold text-white">
      {item.ctaUrl ? (
        <Link href={item.ctaUrl} className="underline-offset-2 hover:underline">
          {item.title}
          {item.ctaLabel ? ` — ${item.ctaLabel} →` : ""}
        </Link>
      ) : (
        item.title
      )}
      <button
        onClick={() => {
          markSeen(item.id);
          setItem(null);
        }}
        aria-label="Dismiss"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

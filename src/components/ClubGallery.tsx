"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { Portal } from "@/components/ui/Portal";

/** A swipeable photo strip; tap a photo for a full-screen viewer you can swipe through. */
export function ClubGallery({ photos, name }: { photos: string[]; name: string }) {
  const [at, setAt] = useState<number | null>(null);
  const [dir, setDir] = useState(0);
  const go = (d: number) => {
    setDir(d);
    setAt((i) => (i === null ? i : (i + d + photos.length) % photos.length));
  };

  useEffect(() => {
    if (at === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.sheet = "open";
    const key = (e: KeyboardEvent) => (e.key === "Escape" ? setAt(null) : e.key === "ArrowRight" ? go(1) : e.key === "ArrowLeft" ? go(-1) : null);
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = prev;
      delete document.body.dataset.sheet;
      window.removeEventListener("keydown", key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at === null]);

  if (!photos.length) return null;
  return (
    <section className="pt-6">
      <h2 className="flex items-center gap-2 px-4 text-[17px] lg:px-0"><Images className="size-4 text-gold" /> Photos</h2>
      <div className="no-scrollbar mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:px-0">
        {photos.map((src, i) => (
          <motion.button
            key={src + i}
            onClick={() => {
              setDir(0);
              setAt(i);
            }}
            whileTap={{ scale: 0.96 }}
            className="relative aspect-[4/5] w-[46%] max-w-[220px] shrink-0 snap-start overflow-hidden rounded-[22px] bg-raised"
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
          >
            <Image src={src} alt={`${name} — photo ${i + 1}`} fill sizes="220px" className="object-cover transition-transform duration-500 hover:scale-105" />
          </motion.button>
        ))}
      </div>

      <Portal>
        <AnimatePresence>
          {at !== null && (
            <motion.div className="fixed inset-0 z-[80] flex flex-col bg-black/95" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] text-white">
                <span className="text-[13px] font-semibold text-white/70">{at + 1} / {photos.length}</span>
                <button onClick={() => setAt(null)} aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10"><X className="size-5" /></button>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden">
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.div
                    key={at}
                    custom={dir}
                    className="absolute inset-0"
                    initial={{ x: dir * 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: dir * -80, opacity: 0 }}
                    transition={{ type: "spring", damping: 28, stiffness: 260 }}
                    drag={photos.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.25}
                    onDragEnd={(_, info) => (info.offset.x < -70 ? go(1) : info.offset.x > 70 ? go(-1) : null)}
                  >
                    <Image src={photos[at]} alt={`${name} — photo ${at + 1}`} fill sizes="100vw" className="object-contain" priority />
                  </motion.div>
                </AnimatePresence>
                {photos.length > 1 && (
                  <>
                    <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid"><ChevronLeft className="size-5" /></button>
                    <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white sm:grid"><ChevronRight className="size-5" /></button>
                  </>
                )}
              </div>
              <div className="flex justify-center gap-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+18px)] pt-4">
                {photos.map((_, i) => (
                  <span key={i} className={`h-1.5 rounded-full transition-all ${i === at ? "w-5 bg-white" : "w-1.5 bg-white/35"}`} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </section>
  );
}

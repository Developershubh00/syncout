"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { X } from "lucide-react";

export function Sheet({
  open, onClose, title, children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[26px] border-t border-line bg-surface"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, i) => (i.offset.y > 130 || i.velocity.y > 700) && onClose()}
          >
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur">
              <div className="flex justify-center pt-2.5">
                <div className="h-1 w-10 rounded-full bg-line" />
              </div>
              {title && (
                <div className="flex items-center justify-between px-5 pb-3 pt-3">
                  <h2 className="text-[19px]">{title}</h2>
                  <button onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted active:bg-raised">
                    <X className="size-5" />
                  </button>
                </div>
              )}
            </div>
            <div className="px-5 pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

/** Native share sheet on phones (WhatsApp, Instagram, Messages…); WhatsApp + copied link elsewhere. */
export function ShareButton({ path, title, text, className, label = "Share" }: { path: string; title: string; text: string; className?: string; label?: string }) {
  const toast = useToast();
  const [done, setDone] = useState(false);

  async function share() {
    const url = new URL(path, window.location.origin).toString();
    track("share", { label: title });
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch {
      return; // user closed the sheet
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      toast("Link copied — opening WhatsApp");
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank", "noopener");
  }

  return (
    <motion.button
      onClick={share}
      whileTap={{ scale: 0.92 }}
      className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-ink/50 px-3.5 text-[13px] font-semibold backdrop-blur hover:border-white/25", className)}
      aria-label={`Share ${title}`}
    >
      {done ? <Check className="size-4 text-gold" /> : <Share2 className="size-4" />}
      {label}
    </motion.button>
  );
}

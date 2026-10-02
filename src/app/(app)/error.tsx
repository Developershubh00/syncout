"use client";
import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RotateCw, Home, MessageCircle, CloudOff } from "lucide-react";

/** Friendly fallback when a page fails to load — never the framework's raw error. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[page error]", error.digest ?? "", error.message);
  }, [error]);
  return (
    <div className="grid min-h-[70vh] place-items-center px-6 text-center">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", damping: 22, stiffness: 200 }}>
        <motion.span
          className="mx-auto grid size-16 place-items-center rounded-2xl bg-raised text-gold"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <CloudOff className="size-7" />
        </motion.span>
        <h1 className="mt-5 font-display text-[26px] font-extrabold">That didn&apos;t load</h1>
        <p className="mx-auto mt-2 max-w-[34ch] text-[14px] leading-relaxed text-muted">
          A hiccup on our side or a weak signal. Your bookings are safe — try again in a moment.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-xl bg-red px-5 text-[14px] font-semibold text-white"><RotateCw className="size-4" /> Try again</button>
          <Link href="/" className="inline-flex h-11 items-center gap-2 rounded-xl bg-raised px-5 text-[14px] font-semibold"><Home className="size-4" /> Home</Link>
          <Link href="/contact" className="inline-flex h-11 items-center gap-2 rounded-xl bg-raised px-5 text-[14px] font-semibold"><MessageCircle className="size-4" /> Get help</Link>
        </div>
      </motion.div>
    </div>
  );
}

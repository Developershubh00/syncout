"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Home, Copy, Check, Scan } from "lucide-react";

/**
 * The firewall's alert page. Truthful and firm: the request was blocked, the IP
 * is logged and flagged, and repeated attempts get the address banned. No claim
 * that we can damage anyone's device (we can't, and saying so would be a lie).
 */
export function BlockedView({ ip, country, ref, at }: { ip: string; country: string | null; ref: string | null; at: string }) {
  const [copied, setCopied] = useState(false);
  const [t, setT] = useState("");
  useEffect(() => {
    setT(new Date(at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "medium" }));
  }, [at]);

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-[#0a0406] px-6 text-center">
      {/* red alert wash + scanning sweep */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(228,17,60,0.22),transparent_60%)]" />
        <motion.div className="absolute inset-x-0 h-24 bg-gradient-to-b from-red/10 to-transparent" animate={{ y: ["-10%", "110%"] }} transition={{ duration: 3.4, repeat: Infinity, ease: "linear" }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)" }} />
      </div>

      <div className="relative w-full max-w-[460px]">
        <motion.div
          className="mx-auto grid size-20 place-items-center rounded-3xl border border-red/40 bg-red/10"
          initial={{ scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", damping: 11, stiffness: 190 }}
        >
          <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ShieldAlert className="size-10 text-red-hot" />
          </motion.span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-5 font-display text-[28px] font-extrabold leading-tight tracking-tight text-red-hot">
          Request blocked
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mx-auto mt-2 max-w-[40ch] text-[13.5px] leading-relaxed text-white/75">
          Our security system flagged this request as a possible attack. If you&apos;re a real guest who hit this by mistake, head back home — you&apos;re fine.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className="mt-6 rounded-2xl border border-red/30 bg-black/40 p-4 text-left">
          <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-red-hot">
            <Scan className="size-3.5" /> Logged for review
          </p>
          <dl className="mt-3 space-y-2 text-[13px]">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/50">Your IP</dt>
              <dd className="flex items-center gap-2 font-mono font-semibold text-white">
                {ip}
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(ip).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    });
                  }}
                  aria-label="Copy IP"
                  className="rounded-md p-1 text-white/50 hover:text-white"
                >
                  {copied ? <Check className="size-3.5 text-gold" /> : <Copy className="size-3.5" />}
                </button>
              </dd>
            </div>
            {country && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Region</dt>
                <dd className="font-semibold text-white">{country}</dd>
              </div>
            )}
            <div className="flex items-center justify-between gap-3">
              <dt className="text-white/50">Time (IST)</dt>
              <dd className="font-semibold text-white">{t || "—"}</dd>
            </div>
            {ref && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-white/50">Ref</dt>
                <dd className="font-mono text-[11px] text-white/70">{ref}</dd>
              </div>
            )}
          </dl>
          <p className="mt-3 border-t border-white/10 pt-3 text-[12px] leading-relaxed text-white/55">
            This address has been recorded and flagged. Continued attempts to probe or attack SyncOut will get it blocked, and may be reported to your network provider and the authorities.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="mt-6">
          <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold text-[#111]">
            <Home className="size-4" /> Go to homepage
          </Link>
          <p className="mt-3 text-[12px] text-white/45">
            Think this is a mistake? Email <a href="mailto:hello@syncout.in" className="underline">hello@syncout.in</a> with the reference above.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

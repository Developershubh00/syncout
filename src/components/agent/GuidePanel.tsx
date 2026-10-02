"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, Hand, Sparkles, Ticket, ArrowUp, MessageCircle } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { Orb } from "./Orb";
import { CHIPS, replyFor, replyForChip, type GuideAction, type GuideCtx } from "@/lib/guide";
import type { Mood } from "@/components/brand/Logo";

type Msg = { from: "me" | "guide"; text: string; actions?: GuideAction[] };

export function waHref(number: string, q: string) {
  const digits = (number || "").replace(/\D/g, "");
  if (!digits) return "/contact";
  const where = typeof window !== "undefined" ? window.location.pathname : "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Hi SyncOut! I need help${q ? `: ${q}` : "."}\n(I was on ${where || "the app"})`)}`;
}

const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 22, stiffness: 240 } } };

export function GuidePanel({
  open, onClose, whatsapp, name, signedIn, mood, look,
}: { open: boolean; onClose: () => void; whatsapp: string; name?: string | null; signedIn: boolean; mood: Mood; look: { x: number; y: number } }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const lastQ = useRef("");
  const scroller = useRef<HTMLDivElement>(null);
  const ctx: GuideCtx = { signedIn, whatsappHref: (q) => waHref(whatsapp, q) };
  const first = name?.split(" ")[0];

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.sheet = "open";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => {
      document.body.style.overflow = prev;
      delete document.body.dataset.sheet;
      window.removeEventListener("keydown", esc);
    };
  }, [open, onClose]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing]);

  function ask(q: string, chipId?: string) {
    const text = q.trim();
    if (!text) return;
    lastQ.current = text;
    setMsgs((m) => [...m, { from: "me", text }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const r = chipId ? replyForChip(chipId, ctx) : replyFor(text, ctx);
      setMsgs((m) => [...m, { from: "guide", ...r }]);
      setTyping(false);
    }, 420 + Math.random() * 380);
  }

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[75]">
            <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.section
              role="dialog"
              aria-label="SyncOut guide"
              className="absolute inset-x-0 bottom-0 flex h-[88vh] flex-col overflow-hidden rounded-t-[28px] border-t border-line bg-[#0d0d10] supports-[height:100dvh]:h-[88dvh] lg:inset-auto lg:bottom-6 lg:right-6 lg:h-[640px] lg:w-[400px] lg:rounded-[28px] lg:border"
              initial={{ y: "100%", opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0.6 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              <header className="shrink-0 px-5 pt-2.5">
                <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line lg:hidden" />
                <div className="flex items-center gap-3 pb-3">
                  <Orb size={40} mood={mood} look={look} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold leading-tight">SyncOut Guide</p>
                    <p className="truncate text-[12px] text-muted">Here to help — a real person on WhatsApp anytime</p>
                  </div>
                  <button onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full bg-raised text-muted">
                    <X className="size-4.5" />
                  </button>
                </div>
              </header>

              <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">
                {msgs.length === 0 ? (
                  <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } } }}>
                    <motion.p variants={item} className="mt-3 flex items-center gap-1.5 text-[14px] text-muted">
                      <Hand className="size-4 text-gold" /> Hi {first || "there"}
                    </motion.p>
                    <motion.h2 variants={item} className="mt-1 font-display text-[32px] font-extrabold leading-[1.02] tracking-tight">
                      How can I help you tonight?
                    </motion.h2>
                    <motion.div variants={item} className="mt-5 grid grid-cols-2 gap-2.5">
                      {[
                        { href: "/dandiya", title: "Book Dandiya tickets", sub: "Navratri · 11–19 Oct", Icon: Sparkles, cls: "from-[#ff2bd6] to-[#e4113c] text-white" },
                        { href: "/nights", title: "Get on a guestlist", sub: "Free · confirmed by 6 PM", Icon: Ticket, cls: "from-[#f2c14e] to-[#ff8a00] text-[#1a1206]" },
                      ].map(({ href, title, sub, Icon, cls }) => (
                        <Link key={href} href={href} onClick={onClose} className={`flex min-h-[132px] flex-col justify-between rounded-[22px] bg-gradient-to-br p-4 ${cls}`}>
                          <span className="grid size-9 place-items-center rounded-full bg-black/15"><Icon className="size-[18px]" /></span>
                          <span>
                            <span className="block text-[15px] font-bold leading-tight">{title}</span>
                            <span className="mt-0.5 block text-[11.5px] opacity-80">{sub}</span>
                          </span>
                        </Link>
                      ))}
                    </motion.div>
                    <motion.p variants={item} className="mt-6 text-[11.5px] font-semibold uppercase tracking-wider text-faint">
                      Popular questions
                    </motion.p>
                    <motion.div variants={item} className="mt-2.5 flex flex-wrap gap-2">
                      {CHIPS.map((c) => (
                        <button key={c.id} onClick={() => ask(c.label, c.id)} className="rounded-full border border-line bg-raised px-3.5 py-2 text-[12.5px] transition-colors hover:border-white/25">
                          {c.label}
                        </button>
                      ))}
                    </motion.div>
                  </motion.div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {msgs.map((m, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={m.from === "me" ? "flex justify-end" : "flex items-start gap-2"}>
                        {m.from === "guide" && <Orb size={24} className="mt-0.5 shrink-0" />}
                        <div className={m.from === "me" ? "max-w-[80%] rounded-[18px] rounded-br-md bg-red px-3.5 py-2.5 text-[13.5px]" : "max-w-[85%]"}>
                          {m.from === "me" ? (
                            m.text
                          ) : (
                            <>
                              <p className="rounded-[18px] rounded-tl-md bg-raised px-3.5 py-2.5 text-[13.5px] leading-relaxed">{m.text}</p>
                              {m.actions && m.actions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {m.actions.map((a) =>
                                    a.whatsapp || a.href.startsWith("http") ? (
                                      <a key={a.label} href={a.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 py-2 text-[12.5px] font-semibold text-white">
                                        <MessageCircle className="size-3.5" /> {a.label}
                                      </a>
                                    ) : (
                                      <Link key={a.label} href={a.href} onClick={onClose} className="rounded-full border border-gold/40 bg-gold/10 px-3.5 py-2 text-[12.5px] font-semibold text-gold">
                                        {a.label}
                                      </Link>
                                    )
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {typing && (
                      <div className="flex items-center gap-2">
                        <Orb size={24} />
                        <span className="flex gap-1 rounded-full bg-raised px-3.5 py-3">
                          {[0, 1, 2].map((d) => (
                            <motion.span key={d} className="size-1.5 rounded-full bg-muted" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <footer className="shrink-0 border-t border-line/70 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    ask(input);
                  }}
                  className="flex items-center gap-2 rounded-full border border-line bg-raised pl-4 pr-1.5"
                >
                  <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything…" className="h-11 min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-faint" />
                  <button type="submit" aria-label="Send" disabled={!input.trim()} className="grid size-9 place-items-center rounded-full bg-red text-white disabled:opacity-40">
                    <ArrowUp className="size-4" />
                  </button>
                </form>
                <a href={waHref(whatsapp, lastQ.current)} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[#25D366]">
                  <MessageCircle className="size-3.5" /> Talk to a person on WhatsApp
                </a>
              </footer>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </Portal>
  );
}

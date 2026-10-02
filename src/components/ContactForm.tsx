"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2 } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const TOPICS = [
  ["general", "General"],
  ["booking", "Booking help"],
  ["partner", "List my venue / event"],
  ["volunteer", "Volunteer"],
  ["press", "Press"],
] as const;

export function ContactForm({ initialTopic = "general" }: { initialTopic?: string }) {
  const toast = useToast();
  const [kind, setKind] = useState(TOPICS.some(([k]) => k === initialTopic) ? initialTopic : "general");
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, kind }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send");
      setSent(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence mode="wait">
      {sent ? (
        <motion.div key="ok" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[20px] border border-gold/30 bg-gold/[0.06] p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-gold" />
          <p className="mt-3 font-display text-[20px] font-extrabold">Message sent</p>
          <p className="mt-1 text-[13.5px] text-muted">We reply within a working day — usually much sooner on WhatsApp.</p>
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3.5">
          <div className="flex flex-wrap gap-2">
            {TOPICS.map(([k, label]) => (
              <button key={k} onClick={() => setKind(k)} className={cn("rounded-full border px-3 py-1.5 text-[13px] transition-colors", kind === k ? "chip-on border-red bg-red/12 text-text" : "border-line text-muted hover:text-text")}>
                {label}
              </button>
            ))}
          </div>
          <Input label="Name" value={f.name} onChange={set("name")} autoComplete="name" />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label="Email" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
            <Input label="Mobile" inputMode="numeric" value={f.phone} onChange={set("phone")} autoComplete="tel" />
          </div>
          <Textarea label="Message" value={f.message} onChange={set("message")} placeholder="How can we help?" />
          <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} className="hidden" aria-hidden />
          <Button size="lg" full loading={busy} onClick={submit}><Send className="size-4" /> Send message</Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

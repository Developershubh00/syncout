"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, ArrowRight } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ApplyButton({
  openingId, roleTitle, kind, label = "Apply",
}: { openingId: string | null; roleTitle: string; kind: "job" | "internship" | "volunteer"; label?: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [f, setF] = useState({ name: "", email: "", phone: "", city: "", link: "", message: "", website: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit() {
    setBusy(true);
    try {
      const res = await fetch("/api/careers/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, openingId, roleTitle, kind }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't send");
      setDone(true);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} size="lg" className="party-cta">
        {label} <ArrowRight className="size-4" />
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={done ? "Application sent" : roleTitle}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <CheckCircle2 className="mx-auto size-12 text-gold" />
              <p className="mt-3 text-[15px] font-semibold">Thanks, {f.name.split(" ")[0] || "there"} — we&apos;ve got it.</p>
              <p className="mt-1 text-[13px] text-muted">We read every application and reply within a week, on email or WhatsApp.</p>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-3.5">
              <Input label="Full name" value={f.name} onChange={set("name")} autoComplete="name" />
              <div className="grid gap-3.5 sm:grid-cols-2">
                <Input label="Email" type="email" value={f.email} onChange={set("email")} autoComplete="email" />
                <Input label="Mobile" inputMode="numeric" value={f.phone} onChange={set("phone")} autoComplete="tel" />
              </div>
              <Input label="City / area" value={f.city} onChange={set("city")} />
              <Input label="LinkedIn, portfolio or resume link" hint="Drive/Dropbox link works" value={f.link} onChange={set("link")} />
              <Textarea label="Why you?" value={f.message} onChange={set("message")} placeholder="A few lines about you, and availability" />
              <input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} className="hidden" aria-hidden />
              <Button size="lg" full loading={busy} onClick={submit}><Send className="size-4" /> Send application</Button>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </>
  );
}

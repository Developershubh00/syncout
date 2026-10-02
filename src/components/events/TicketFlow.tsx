"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ExternalLink, Lock, Minus, Plus, Ticket, MessageCircle } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { ThankYouSplash } from "@/components/fx/ThankYouSplash";
import { dayLabel, rs } from "@/lib/event-format";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";

export type FlowTier = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  admits: number;
  perOrderMax: number;
  /** Tickets left per day, null = no cap. */
  left: Record<string, number> | null;
};

export type FlowEvent = {
  id: string;
  title: string;
  venueName: string;
  days: string[];
  bookingMode: "upi" | "whatsapp" | "external" | "free";
  externalUrl: string | null;
  open: boolean;
  closedReason: string;
  upiReady: boolean;
};

export function TicketFlow({ event, tiers, user }: { event: FlowEvent; tiers: FlowTier[]; user: { name: string; email: string } | null }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [day, setDay] = useState(event.days[0]);
  const [tierId, setTierId] = useState<string | null>(tiers.length === 1 ? tiers[0].id : null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<{ code: string; url: string; mode: string } | null>(null);
  const [form, setForm] = useState({ name: user?.name ?? "", phone: "", email: user?.email ?? "", note: "" });

  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const leftFor = (t: FlowTier) => (t.left ? t.left[day] ?? null : null);
  const max = tier ? Math.max(0, Math.min(tier.perOrderMax, leftFor(tier) ?? tier.perOrderMax)) : 1;
  const total = tier ? tier.price * qty : 0;
  const from = useMemo(() => (tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0), [tiers]);
  const mode = total === 0 ? "free" : event.bookingMode === "upi" && !event.upiReady ? "whatsapp" : event.bookingMode;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Tell us your name";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = "10-digit Indian mobile number";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Your tickets are sent here";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!tier || !validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          tierId: tier.id,
          quantity: qty,
          day,
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          note: form.note,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      track("order_created", { value: total, label: event.title });
      setOpen(false);
      setDone({ code: data.code, url: data.url, mode: data.mode });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't book — try again", "err");
    } finally {
      setBusy(false);
    }
  }

  if (event.bookingMode === "external" && event.externalUrl) {
    return (
      <div className="sticky bottom-[78px] z-20 mt-7 px-4 lg:static lg:px-0">
        <a href={event.externalUrl} target="_blank" rel="noreferrer" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] text-[15px] font-semibold text-white">
          Get tickets <ExternalLink className="size-4" />
        </a>
      </div>
    );
  }

  if (!event.open || !tiers.length) {
    return (
      <div className="sticky bottom-[74px] z-20 mt-7 px-4 lg:static lg:px-0">
        <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold"><Lock className="size-4 text-faint" /> Bookings closed</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{event.closedReason}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky bottom-[78px] z-20 mt-7 px-4 lg:static lg:px-0">
        <button
          onClick={() => {
            setOpen(true);
            setStep(0);
            track("begin_checkout", { label: event.title });
          }}
          className="party-cta flex h-14 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold text-white"
        >
          <Ticket className="size-4" /> Book tickets {from ? `· from ${rs(from)}` : "· free"}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={step === 0 ? "Pick your tickets" : step === 1 ? "Your details" : "Check and book"}>
        <p className="-mt-1 mb-4 text-[12.5px] text-muted">
          {event.title} · {event.venueName}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              {event.days.length > 1 && (
                <>
                  <p className="mb-2 text-[13px] font-medium text-muted">Date</p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {event.days.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setDay(d);
                          setQty(1);
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-[13px] font-semibold transition-colors",
                          d === day ? "border-[#ff2bd6] bg-[#ff2bd6]/12 text-text" : "border-line bg-raised text-muted"
                        )}
                      >
                        {dayLabel(d)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="space-y-2.5">
                {tiers.map((t) => {
                  const left = leftFor(t);
                  const soldOut = left !== null && left <= 0;
                  const active = t.id === tierId;
                  return (
                    <button
                      key={t.id}
                      disabled={soldOut}
                      onClick={() => {
                        setTierId(t.id);
                        setQty(1);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors",
                        active ? "border-[#ff2bd6] bg-[#ff2bd6]/10" : "border-line bg-raised",
                        soldOut && "opacity-40"
                      )}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{t.name}</span>
                        <span className="block text-[12px] text-muted">
                          {t.description || (t.admits > 1 ? `Admits ${t.admits}` : "Admits 1")}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[14px] font-bold text-gold">{rs(t.price)}</span>
                        <span className="block text-[11px] text-faint">{soldOut ? "Sold out" : left !== null && left < 20 ? `${left} left` : ""}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {tier && (
                <div className="mt-5 flex items-center justify-between rounded-2xl border border-line bg-raised px-4 py-3">
                  <span className="text-[14.5px]">Tickets</span>
                  <div className="flex items-center gap-1">
                    <button aria-label="Fewer" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="grid size-9 place-items-center rounded-xl bg-surface text-muted disabled:opacity-35">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-9 text-center font-display text-[17px] font-bold tabular-nums">{qty}</span>
                    <button aria-label="More" onClick={() => setQty((q) => Math.min(max, q + 1))} disabled={qty >= max} className="grid size-9 place-items-center rounded-xl bg-surface text-muted disabled:opacity-35">
                      <Plus className="size-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[13px] text-muted">Total</span>
                <span className="font-display text-[22px] font-extrabold">{rs(total)}</span>
              </div>
              <Button size="lg" full className="mt-4" disabled={!tier || max < 1} onClick={() => setStep(1)}>
                Continue
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" className="space-y-3.5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              <Input label="Full name" placeholder="As on your ID" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
              <Input label="Mobile" hint="WhatsApp number, ideally" inputMode="numeric" placeholder="98XXXXXXXX" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
              <Input label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
              <Textarea label="Anything we should know?" placeholder="Group names, a birthday…" value={form.note} onChange={set("note")} />
              <div className="flex gap-2.5 pt-1">
                <Button variant="ghost" size="lg" onClick={() => setStep(0)}>Back</Button>
                <Button size="lg" full onClick={() => validate() && setStep(2)}>Review</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && tier && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              <dl className="divide-y divide-line rounded-2xl border border-line bg-raised px-4">
                <Row k="Date" v={dayLabel(day)} />
                <Row k="Tickets" v={`${qty} × ${tier.name}`} />
                <Row k="Name" v={form.name} />
                <Row k="Mobile" v={form.phone} />
                <Row k="Total" v={rs(total)} strong />
              </dl>
              <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
                {mode === "upi" && <p>Next you&apos;ll see a UPI QR for {rs(total)}. Pay from any UPI app, then send us the screenshot on WhatsApp — we confirm your tickets right after.</p>}
                {mode === "whatsapp" && (
                  <p className="flex gap-2"><MessageCircle className="mt-0.5 size-4 shrink-0 text-[#25D366]" /> Next, send your booking to us on WhatsApp and we&apos;ll share payment details and confirm your tickets there.</p>
                )}
                {mode === "free" && <p>This one&apos;s free — we&apos;ll confirm your spot shortly.</p>}
              </div>
              <div className="mt-5 flex gap-2.5">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>Back</Button>
                <Button size="lg" full loading={busy} onClick={submit}>Book now</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>

      <ThankYouSplash
        open={Boolean(done)}
        title="Booking requested"
        body={
          done?.mode === "upi"
            ? "Now pay with the UPI QR and send the screenshot on WhatsApp."
            : done?.mode === "whatsapp"
            ? "One more tap: send it to us on WhatsApp."
            : "We'll confirm your spot shortly."
        }
        code={done?.code}
        autoMs={2800}
        onDone={() => done && router.push(done.url)}
      />
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="shrink-0 text-[12.5px] text-muted">{k}</dt>
      <dd className={cn("truncate text-right text-[13.5px]", strong && "font-display text-[17px] font-extrabold text-gold")}>{v}</dd>
    </div>
  );
}

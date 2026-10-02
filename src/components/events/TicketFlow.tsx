"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ExternalLink, Lock, Minus, Plus, Ticket, MessageCircle, BellRing, TicketPercent, BadgeCheck } from "lucide-react";
import { Countdown } from "@/components/events/Countdown";
import { readSavedPromo } from "@/components/PromoCapture";
import { Sheet, SheetFooter } from "@/components/ui/Sheet";
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
  compareAtPrice?: number | null;
  badge?: string | null;
  /** ISO — sale window for early-bird / phased tickets. */
  salesStartAt?: string | null;
  salesEndAt?: string | null;
};

export type FlowEvent = {
  id: string;
  slug: string;
  title: string;
  venueName: string;
  days: string[];
  bookingMode: "request" | "upi" | "whatsapp" | "external" | "free";
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
  const [done, setDone] = useState<{ code: string; url: string; mode: string; account: string | null; qr: string | null } | null>(null);
  const [form, setForm] = useState({ name: user?.name ?? "", phone: "", email: user?.email ?? "", note: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string; discount: number; key: string } | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [wait, setWait] = useState<{ tierId: string; tierName: string } | null>(null);
  const [waitDone, setWaitDone] = useState(false);

  useEffect(() => {
    const saved = readSavedPromo();
    if (saved) setPromoInput(saved);
  }, []);

  // Shared links (/b/slug → ?book=1) open the booking sheet straight away — after the welcome animation if it's playing.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("book") || !event.open || !tiers.length || event.bookingMode === "external") return;
    const splash = document.querySelector(".splash") && !document.documentElement.classList.contains("no-splash");
    const t = setTimeout(() => setOpen(true), splash ? 4900 : 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const leftFor = (t: FlowTier) => (t.left ? t.left[day] ?? null : null);
  const max = tier ? Math.max(0, Math.min(tier.perOrderMax, leftFor(tier) ?? tier.perOrderMax)) : 1;
  const subtotal = tier ? tier.price * qty : 0;
  // A quote is only good for the exact ticket and count it was made for.
  const quoteKey = `${tierId}|${qty}`;
  const discount = promo && promo.key === quoteKey ? promo.discount : 0;
  const total = subtotal - discount;
  const saleState = (t: FlowTier): "soon" | "ended" | "on" => {
    const n = Date.now();
    if (t.salesStartAt && new Date(t.salesStartAt).getTime() > n) return "soon";
    if (t.salesEndAt && new Date(t.salesEndAt).getTime() <= n) return "ended";
    return "on";
  };
  const from = useMemo(() => {
    const live = tiers.filter((t) => saleState(t) === "on");
    return live.length ? Math.min(...live.map((t) => t.price)) : tiers.length ? Math.min(...tiers.map((t) => t.price)) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiers]);

  async function applyPromo(code = promoInput) {
    if (!tier || !code.trim()) return;
    setChecking(true);
    setPromoErr(null);
    try {
      const res = await fetch("/api/promos/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), eventId: event.id, tierId: tier.id, quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "That code isn't valid");
      setPromo({ code: data.code, label: data.label, discount: data.discount, key: quoteKey });
    } catch (e) {
      setPromo(null);
      setPromoErr(e instanceof Error ? e.message : "That code isn't valid");
    } finally {
      setChecking(false);
    }
  }

  // Entering review with a saved/typed code: apply it for this ticket and count.
  useEffect(() => {
    if (step === 2 && promoInput && (!promo || promo.key !== quoteKey)) applyPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, quoteKey]);

  async function joinWaitlist() {
    if (!wait) return;
    if (form.name.trim().length < 2 || !/^[6-9]\d{9}$/.test(form.phone.trim())) {
      setErrors({ name: form.name.trim().length < 2 ? "Tell us your name" : "", phone: /^[6-9]\d{9}$/.test(form.phone.trim()) ? "" : "10-digit Indian mobile number" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id, tierId: wait.tierId, day, name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), quantity: qty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't add you");
      setWaitDone(true);
      track("waitlist_join", { label: event.title });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't add you", "err");
    } finally {
      setBusy(false);
    }
  }
  const mode = total === 0 ? "free" : (event.bookingMode === "upi" && !event.upiReady) || event.bookingMode === "whatsapp" ? "request" : event.bookingMode;

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
          promoCode: discount ? promo?.code : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      track("order_created", { value: total, label: event.title });
      setOpen(false);
      setDone({ code: data.code, url: data.url, mode: data.mode, account: data.account ?? null, qr: data.qr ?? null });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't book — try again", "err");
    } finally {
      setBusy(false);
    }
  }

  if (event.bookingMode === "external" && event.externalUrl) {
    return (
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] z-20 mt-7 flex justify-center px-5 lg:static lg:px-0">
        <a href={event.externalUrl} target="_blank" rel="noreferrer" className="flex h-14 w-full max-w-[440px] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgba(228,17,60,.8)]">
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
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] z-20 mt-7 flex justify-center px-5 lg:static lg:px-0">
        <button
          onClick={() => {
            setOpen(true);
            setStep(0);
            track("begin_checkout", { label: event.title });
          }}
          className="party-cta flex h-14 w-full max-w-[440px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgba(228,17,60,.8)]"
        >
          <Ticket className="size-4" /> Book tickets {from ? `· from ${rs(from)}` : "· free"}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} title={step === 0 ? "Pick your tickets" : step === 1 ? "Your details" : step === 3 ? "Join the waitlist" : "Check and book"}>
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
                  const sale = saleState(t);
                  const unavailable = soldOut || sale !== "on";
                  const active = t.id === tierId && !unavailable;
                  return (
                    <div key={t.id} className={cn("rounded-2xl border transition-colors", active ? "border-[#ff2bd6] bg-[#ff2bd6]/10" : "border-line bg-raised", unavailable && "opacity-70")}>
                      <button
                        disabled={unavailable}
                        onClick={() => {
                          setTierId(t.id);
                          setQty(1);
                        }}
                        className="flex w-full items-center gap-3.5 p-4 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[15px] font-semibold">{t.name}</span>
                            {t.badge && <span className="rounded-md bg-gold/15 px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-gold">{t.badge}</span>}
                          </span>
                          <span className="block text-[12px] text-muted">{t.description || (t.admits > 1 ? `Admits ${t.admits}` : "Admits 1")}</span>
                          {sale === "on" && t.salesEndAt && !soldOut && (
                            <Countdown until={t.salesEndAt} prefix="Price ends in" className="mt-1 flex items-center gap-1 text-[11.5px] text-[#ff6ad5]" />
                          )}
                          {sale === "soon" && t.salesStartAt && <Countdown until={t.salesStartAt} prefix="Opens in" className="mt-1 block text-[11.5px] text-muted" />}
                        </span>
                        <span className="shrink-0 text-right">
                          {t.compareAtPrice && t.compareAtPrice > t.price && <span className="block text-[11.5px] text-faint line-through">{rs(t.compareAtPrice)}</span>}
                          <span className="block text-[14px] font-bold text-gold">{rs(t.price)}</span>
                          <span className="block text-[11px] text-faint">
                            {sale === "ended" ? "Ended" : soldOut ? "Sold out" : left !== null && left < 20 ? `${left} left` : t.compareAtPrice && t.compareAtPrice > t.price ? `Save ${rs(t.compareAtPrice - t.price)}` : ""}
                          </span>
                        </span>
                      </button>
                      {soldOut && sale === "on" && (
                        <button
                          onClick={() => {
                            setWait({ tierId: t.id, tierName: t.name });
                            setWaitDone(false);
                            setStep(3);
                          }}
                          className="mx-4 mb-3.5 -mt-1 inline-flex items-center gap-1.5 rounded-full border border-[#ff2bd6]/50 px-3 py-1.5 text-[12.5px] font-semibold text-[#ff6ad5]"
                        >
                          <BellRing className="size-3.5" /> Join the waitlist
                        </button>
                      )}
                    </div>
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

              <SheetFooter>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[12px] text-muted">Total · {qty} {qty === 1 ? "ticket" : "tickets"}</p>
                    <p className="font-display text-[22px] font-extrabold leading-tight">{rs(total)}</p>
                  </div>
                  <Button size="lg" className="min-w-[150px]" disabled={!tier || max < 1} onClick={() => setStep(1)}>
                    Continue
                  </Button>
                </div>
              </SheetFooter>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="s1" className="space-y-3.5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              <Input label="Full name" placeholder="As on your ID" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
              <Input label="Mobile" hint="WhatsApp number, ideally" inputMode="numeric" placeholder="98XXXXXXXX" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
              <Input label="Email" type="email" placeholder="you@email.com" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
              <Textarea label="Anything we should know?" placeholder="Group names, a birthday…" value={form.note} onChange={set("note")} />
              <SheetFooter>
                <div className="flex gap-2.5">
                  <Button variant="ghost" size="lg" onClick={() => setStep(0)}>Back</Button>
                  <Button size="lg" full onClick={() => validate() && setStep(2)}>Review · {rs(total)}</Button>
                </div>
              </SheetFooter>
            </motion.div>
          )}

          {step === 2 && tier && (
            <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              <dl className="divide-y divide-line rounded-2xl border border-line bg-raised px-4">
                <Row k="Date" v={dayLabel(day)} />
                <Row k="Tickets" v={`${qty} × ${tier.name}`} />
                <Row k="Name" v={form.name} />
                <Row k="Mobile" v={form.phone} />
                {discount > 0 && <Row k="Subtotal" v={rs(subtotal)} />}
                {discount > 0 && <Row k={`Code ${promo?.code}`} v={`−${rs(discount)}`} />}
                <Row k="Total" v={rs(total)} strong />
              </dl>

              <div className="mt-3 rounded-2xl border border-dashed border-line p-3">
                {discount > 0 ? (
                  <div className="flex items-center gap-2 text-[13px]">
                    <TicketPercent className="size-4 shrink-0 text-gold" />
                    <span className="min-w-0 flex-1 truncate"><b>{promo?.label}</b> — you save {rs(discount)}</span>
                    <button onClick={() => { setPromo(null); setPromoInput(""); try { localStorage.removeItem("so_promo"); } catch {} }} className="text-[12px] text-muted underline">Remove</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <TicketPercent className="size-4 shrink-0 text-faint" />
                    <input
                      value={promoInput}
                      onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(null); }}
                      placeholder="Promo code"
                      className="h-9 min-w-0 flex-1 bg-transparent text-[13.5px] uppercase outline-none placeholder:normal-case placeholder:text-faint"
                    />
                    <Button size="sm" variant="ghost" loading={checking} disabled={!promoInput.trim()} onClick={() => applyPromo()}>Apply</Button>
                  </div>
                )}
                {promoErr && <p className="mt-1.5 text-[12px] text-red-hot">{promoErr}</p>}
              </div>
              <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
                {mode === "upi" && <p>Next you&apos;ll see a UPI QR for {rs(total)}. Pay from any UPI app and add the UPI reference — we confirm your tickets right after.</p>}
                {mode === "request" && (
                  <p className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold" /> No payment step now — your booking goes straight to the SyncOut team and your entry QR is ready instantly. You&apos;ll get a notification the moment it&apos;s confirmed.</p>
                )}
                {mode === "free" && <p>This one&apos;s free — we&apos;ll confirm your spot shortly.</p>}
                <p className="mt-2 text-[11.5px] text-faint">
                  By booking you agree to the <a href="/terms" target="_blank" className="underline">Terms</a> and{" "}
                  <a href="/refunds" target="_blank" className="underline">Refund policy</a>.
                </p>
              </div>
              <SheetFooter>
                <div className="flex gap-2.5">
                  <Button variant="ghost" size="lg" onClick={() => setStep(1)}>Back</Button>
                  <Button size="lg" full loading={busy} onClick={submit}>Book now · {rs(total)}</Button>
                </div>
              </SheetFooter>
            </motion.div>
          )}

          {step === 3 && wait && (
            <motion.div key="s3" className="space-y-3.5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
              {waitDone ? (
                <div className="py-6 text-center">
                  <BellRing className="mx-auto size-10 text-gold" />
                  <p className="mt-3 text-[16px] font-semibold">You&apos;re on the waitlist</p>
                  <p className="mx-auto mt-1 max-w-[30ch] text-[13px] text-muted">
                    If {wait.tierName} opens up for {dayLabel(day)}, we&apos;ll message you first on WhatsApp{user ? " and in the app" : ""}.
                  </p>
                  <Button variant="ghost" className="mt-5" onClick={() => setStep(0)}>See other tickets</Button>
                </div>
              ) : (
                <>
                  <p className="text-[13px] leading-relaxed text-muted">
                    <b className="text-text">{wait.tierName}</b> is sold out for {dayLabel(day)}. Leave your number — when spots free up, the waitlist hears first.
                  </p>
                  <Input label="Full name" value={form.name} onChange={set("name")} error={errors.name || undefined} autoComplete="name" />
                  <Input label="Mobile (WhatsApp)" inputMode="numeric" value={form.phone} onChange={set("phone")} error={errors.phone || undefined} autoComplete="tel" />
                  <SheetFooter>
                    <div className="flex gap-2.5">
                      <Button variant="ghost" size="lg" onClick={() => setStep(0)}>Back</Button>
                      <Button size="lg" full loading={busy} onClick={joinWaitlist}><BellRing className="size-4" /> Notify me · {qty}</Button>
                    </div>
                  </SheetFooter>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>

      <ThankYouSplash
        open={Boolean(done)}
        title={done?.mode === "upi" ? "Booking saved" : done?.mode === "free" ? "You're booked" : "Booking received"}
        body={
          done?.mode === "upi"
            ? "Next: pay by UPI on your ticket page. This QR is your entry pass."
            : "Your entry QR is ready. We're confirming your booking now — you'll get a notification the moment it's done."
        }
        code={done?.code}
        qr={done?.qr ?? undefined}
        festive
        autoMs={0}
        note={
          done?.account === "created"
            ? "Saved to your new SyncOut account — you're logged in, so your ticket and its status are always in Passes."
            : done?.account === "existing"
              ? `Saved to the SyncOut account for ${form.email.trim()}. Log in to see it in Passes.`
              : undefined
        }
        actions={
          done ? (
            <>
              <button onClick={() => router.push(done.url)} className="flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-white text-[15px] font-semibold text-[#111]">
                <Ticket className="size-5" /> {done.mode === "upi" ? "Pay & view ticket" : "View my ticket"}
              </button>
              <button
                onClick={async () => {
                  const url = `${window.location.origin}/b/${event.slug}`;
                  try {
                    if (navigator.share) return await navigator.share({ title: event.title, text: `I'm going to ${event.title} — book yours:`, url });
                  } catch {
                    return;
                  }
                  window.open(`https://wa.me/?text=${encodeURIComponent(`I'm going to ${event.title} — book yours: ${url}`)}`, "_blank", "noopener");
                }}
                className="h-12 rounded-2xl border border-white/15 text-[14px] font-semibold text-white/85"
              >
                Invite friends
              </button>
            </>
          ) : undefined
        }
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

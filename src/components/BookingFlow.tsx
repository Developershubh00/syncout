"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ArrowRight, Lock, Users, User, Heart } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { friendlyDate, cn, rupees } from "@/lib/utils";

type EntryId = "stag_female" | "couple" | "stag_male";

type Night = {
  id: string;
  slug: string;
  title: string;
  clubName: string;
  startsAt: string;
  femaleEnabled: boolean;
  coupleEnabled: boolean;
  maleEnabled: boolean;
  femalePrice: number;
  couplePrice: number;
  malePrice: number;
  dressCode: string | null;
};

const ARRIVALS = ["9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM"];

export function BookingFlow({
  night,
  left,
  window: win,
  user,
}: {
  night: Night;
  left: Record<EntryId, number>;
  window: { open: boolean; message: string; closesAt: string };
  user: { id: string; name: string; email: string } | null;
}) {
  const router = useRouter();
  const toast = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [entry, setEntry] = useState<EntryId | null>(null);
  const [girls, setGirls] = useState(1);
  const [guys, setGuys] = useState(0);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    guestName: user?.name ?? "",
    guestPhone: "",
    guestEmail: user?.email ?? "",
    guestInstagram: "",
    arrivalTime: "9:30 PM",
    notes: "",
  });

  const options = useMemo(
    () =>
      (
        [
          { id: "stag_female" as const, label: "Girls", sub: "Solo or with your friends", Icon: User, on: night.femaleEnabled, price: night.femalePrice },
          { id: "couple" as const, label: "Couple", sub: "One girl and one guy", Icon: Heart, on: night.coupleEnabled, price: night.couplePrice },
          { id: "stag_male" as const, label: "Guys", sub: "Fewest spots — apply early", Icon: Users, on: night.maleEnabled, price: night.malePrice },
        ] as const
      ).filter((o) => o.on),
    [night]
  );

  const total = entry === "couple" ? girls + guys : entry === "stag_female" ? girls : guys;
  const spotsLeft = entry ? left[entry] : 0;

  function choose(id: EntryId) {
    setEntry(id);
    if (id === "stag_female") { setGirls(1); setGuys(0); }
    if (id === "couple") { setGirls(1); setGuys(1); }
    if (id === "stag_male") { setGirls(0); setGuys(1); }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (form.guestName.trim().length < 2) e.guestName = "Tell us your name";
    if (!/^[6-9]\d{9}$/.test(form.guestPhone.trim())) e.guestPhone = "10-digit Indian mobile number";
    if (!/^\S+@\S+\.\S+$/.test(form.guestEmail.trim())) e.guestEmail = "We send your pass here";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!entry || !validate()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: night.id,
          entryType: entry,
          femaleCount: girls,
          maleCount: guys,
          ...form,
          guestPhone: form.guestPhone.trim(),
          guestEmail: form.guestEmail.trim(),
          companions: [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setOpen(false);
      router.push(`/passes/${data.code}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't submit — try again", "err");
    } finally {
      setBusy(false);
    }
  }

  /* ── closed state ── */
  if (!win.open) {
    return (
      <div className="sticky bottom-[74px] z-20 mt-7 px-4">
        <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
          <p className="flex items-center gap-2 text-[13.5px] font-semibold">
            <Lock className="size-4 text-faint" />
            Guestlist closed
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{win.message}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-7 px-4">
        <p className="text-[12.5px] text-gold">{win.message}</p>
      </div>

      <div className="sticky bottom-[78px] z-20 mt-3 px-4">
        <Button size="lg" full onClick={() => { setOpen(true); setStep(0); }}>
          Apply to the guestlist
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={step === 0 ? "Who's coming?" : step === 1 ? "Your details" : "Check and send"}
      >
        <p className="-mt-1 mb-4 text-[12.5px] text-muted">
          {night.title} · {night.clubName} · {friendlyDate(night.startsAt)}
        </p>

        <AnimatePresence mode="wait" initial={false}>
          {/* ── step 1: entry type ── */}
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="space-y-2.5">
                {options.map((o) => {
                  const remaining = left[o.id];
                  const soldOut = remaining <= 0;
                  const active = entry === o.id;
                  return (
                    <button
                      key={o.id}
                      disabled={soldOut}
                      onClick={() => choose(o.id)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors",
                        active ? "border-red bg-red/10" : "border-line bg-raised",
                        soldOut && "opacity-40"
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl",
                          active ? "bg-red text-white" : "bg-surface text-muted"
                        )}
                      >
                        <o.Icon className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{o.label}</span>
                        <span className="block text-[12px] text-muted">{o.sub}</span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block text-[13px] font-semibold text-gold">{rupees(o.price)}</span>
                        <span className="block text-[11px] text-faint">
                          {soldOut ? "Full" : `${remaining} left`}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {entry && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 space-y-3">
                    {(entry === "stag_female" || entry === "couple") && (
                      <Counter
                        label="Girls"
                        value={girls}
                        min={entry === "couple" ? 1 : 1}
                        max={entry === "couple" ? 4 : 5}
                        onChange={setGirls}
                      />
                    )}
                    {(entry === "stag_male" || entry === "couple") && (
                      <Counter
                        label="Guys"
                        value={guys}
                        min={1}
                        max={entry === "couple" ? 4 : 3}
                        onChange={setGuys}
                      />
                    )}
                    {total > spotsLeft && (
                      <p className="text-[12.5px] text-red-hot">
                        Only {spotsLeft} spots left on this list. Reduce the count to continue.
                      </p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    full
                    className="mt-5"
                    disabled={total < 1 || total > spotsLeft}
                    onClick={() => setStep(1)}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── step 2: details ── */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-3.5"
            >
              <Input
                label="Full name"
                placeholder="As on your ID"
                value={form.guestName}
                onChange={set("guestName")}
                error={errors.guestName}
                autoComplete="name"
              />
              <Input
                label="Mobile"
                hint="We call if the door needs you"
                inputMode="numeric"
                placeholder="98XXXXXXXX"
                value={form.guestPhone}
                onChange={set("guestPhone")}
                error={errors.guestPhone}
                autoComplete="tel"
              />
              <Input
                label="Email"
                hint="Your pass lands here"
                type="email"
                placeholder="you@email.com"
                value={form.guestEmail}
                onChange={set("guestEmail")}
                error={errors.guestEmail}
                autoComplete="email"
              />
              <Input
                label="Instagram"
                hint="Optional"
                placeholder="@handle"
                value={form.guestInstagram}
                onChange={set("guestInstagram")}
              />
              <Select label="Reaching by" value={form.arrivalTime} onChange={set("arrivalTime")}>
                {ARRIVALS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
              <Textarea
                label="Anything we should know?"
                placeholder="Birthday, table request, dietary needs…"
                value={form.notes}
                onChange={set("notes")}
              />

              <div className="flex gap-2.5 pt-1">
                <Button variant="ghost" size="lg" onClick={() => setStep(0)}>Back</Button>
                <Button size="lg" full onClick={() => validate() && setStep(2)}>Review</Button>
              </div>
            </motion.div>
          )}

          {/* ── step 3: review ── */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              <dl className="divide-y divide-line rounded-2xl border border-line bg-raised px-4">
                <Row k="Entry" v={entry === "couple" ? "Couple" : entry === "stag_female" ? "Girls" : "Guys"} />
                <Row k="Guests" v={`${total} (${girls} girl${girls === 1 ? "" : "s"}, ${guys} guy${guys === 1 ? "" : "s"})`} />
                <Row k="Name" v={form.guestName} />
                <Row k="Mobile" v={form.guestPhone} />
                <Row k="Email" v={form.guestEmail} />
                <Row k="Reaching by" v={form.arrivalTime} />
              </dl>

              <div className="mt-4 rounded-2xl border border-line bg-surface p-4 text-[12.5px] leading-relaxed text-muted">
                <p>
                  Applying doesn&apos;t charge you anything. We confirm every list by 6 PM on the day
                  and email you either way.
                </p>
                {night.dressCode && <p className="mt-2 text-text">{night.dressCode}</p>}
                <p className="mt-2">Carry a government photo ID. 21+ only. Entry stays at the venue&apos;s discretion.</p>
              </div>

              <div className="mt-5 flex gap-2.5">
                <Button variant="ghost" size="lg" onClick={() => setStep(1)}>Back</Button>
                <Button size="lg" full loading={busy} onClick={submit}>Send application</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Sheet>
    </>
  );
}

function Counter({
  label, value, min, max, onChange,
}: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-raised px-4 py-3">
      <span className="text-[14.5px]">{label}</span>
      <div className="flex items-center gap-1">
        <button
          aria-label={`Fewer ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid size-9 place-items-center rounded-xl bg-surface text-muted disabled:opacity-35"
        >
          <Minus className="size-4" />
        </button>
        <span className="w-9 text-center font-display text-[17px] font-bold tabular-nums">{value}</span>
        <button
          aria-label={`More ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="grid size-9 place-items-center rounded-xl bg-surface text-muted disabled:opacity-35"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="shrink-0 text-[12.5px] text-muted">{k}</dt>
      <dd className="truncate text-right text-[13.5px]">{v}</dd>
    </div>
  );
}

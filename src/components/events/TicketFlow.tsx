"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, BadgeCheck, BellRing, Check, Clock, Download, ExternalLink, Lock, MapPin, Minus, Plus, Share2, Ticket, TicketPercent, X, Camera, ImagePlus, Loader2, ShieldCheck } from "lucide-react";
import { Portal } from "@/components/ui/Portal";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Countdown } from "@/components/events/Countdown";
import { RollingNumber } from "@/components/motion/RollingNumber";
import { readSavedPromo } from "@/components/PromoCapture";
import { playConfirm } from "@/lib/sound";
import { ticketPath } from "@/components/booking/ticket-shape";
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
  poster?: string | null;
  timeText?: string;
  cityLabel?: string;
  requiresVerification?: boolean;
  verificationNote?: string | null;
};

type Step = "tickets" | "qty" | "details" | "photo" | "review" | "processing" | "done" | "wait";
type Done = { code: string; url: string; mode: string; account: string | null; qr: string | null; verifying?: boolean };
const ORDER: Step[] = ["tickets", "qty", "details", "photo", "review", "processing", "done"];

/* ── a paper ticket that sizes its outline to whatever it holds ── */
function TicketShape({ cut, selected, children, className, layoutId, tone = "#ffffff" }: { cut: number | ((h: number) => number); selected?: boolean; children: React.ReactNode; className?: string; layoutId?: string; tone?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const c = typeof cut === "function" ? cut(box.h) : cut;
  return (
    <motion.div ref={ref} layoutId={layoutId} className={cn("relative", className)} transition={{ type: "spring", damping: 26, stiffness: 260 }}>
      {box.w > 0 && (
        <svg className="pointer-events-none absolute inset-0 overflow-visible" width={box.w} height={box.h} aria-hidden>
          <defs>
            <linearGradient id="tk-sel" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff2bd6" />
              <stop offset="1" stopColor="#ff8a00" />
            </linearGradient>
          </defs>
          <path d={ticketPath(box.w, box.h, c)} fill={tone} stroke={selected ? "url(#tk-sel)" : "none"} strokeWidth={selected ? 3 : 0} style={{ filter: "drop-shadow(0 18px 30px rgba(0,0,0,.45))" }} />
          <line x1={22} y1={c} x2={box.w - 22} y2={c} stroke="#d9d9de" strokeWidth={2} strokeDasharray="6 6" />
        </svg>
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function Burst() {
  const reduce = useReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2;
        const d = 120 + Math.random() * 160;
        return { x: Math.cos(a) * d, y: Math.sin(a) * d - 60, r: Math.random() * 540 - 270, c: ["#ff2bd6", "#e4113c", "#f2c14e", "#ffffff", "#00e5ff", "#ff8a00"][i % 6], w: i % 2 ? 10 : 6 };
      }),
    []
  );
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[30%] z-20" aria-hidden>
      {bits.map((b, i) => (
        <motion.span
          key={i}
          className="absolute block rounded-[2px]"
          style={{ width: b.w, height: 6, background: b.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: b.x, y: [0, b.y, b.y + 140], opacity: [1, 1, 0], rotate: b.r }}
          transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.45, 1], delay: 0.15 }}
        />
      ))}
    </div>
  );
}

const slide = {
  enter: (d: number) => ({ x: d * 56, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 26, stiffness: 260 } },
  exit: (d: number) => ({ x: d * -56, opacity: 0, transition: { duration: 0.18 } }),
};

function tile(day: string) {
  const d = new Date(`${day}T12:00:00+05:30`);
  const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...o }).format(d);
  return { mon: f({ month: "short" }).toUpperCase(), date: f({ day: "numeric" }) };
}

export function TicketFlow({ event, tiers, user }: { event: FlowEvent; tiers: FlowTier[]; user: { name: string; email: string } | null }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("tickets");
  const [dir, setDir] = useState(1);
  const [day, setDay] = useState(event.days[0]);
  const [tierId, setTierId] = useState<string | null>(tiers.length === 1 ? tiers[0].id : null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Done | null>(null);
  const [form, setForm] = useState({ name: user?.name ?? "", phone: "", email: user?.email ?? "", note: "" });
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; label: string; discount: number; key: string } | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [wait, setWait] = useState<{ tierId: string; tierName: string } | null>(null);
  const [waitDone, setWaitDone] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [wantUpdates, setWantUpdates] = useState(true);
  const needsPhoto = Boolean(event.requiresVerification);

  useEffect(() => {
    const saved = readSavedPromo();
    if (saved) setPromoInput(saved);
  }, []);

  // Shared links (/b/slug → ?book=1) open booking straight away — after the welcome animation if it's playing.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("book") || !event.open || !tiers.length || event.bookingMode === "external") return;
    const splash = document.querySelector(".splash") && !document.documentElement.classList.contains("no-splash");
    const t = setTimeout(() => setOpen(true), splash ? 4900 : 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While the theatre is open: no page scroll, guide orb steps aside.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.dataset.sheet = "open";
    return () => {
      document.body.style.overflow = prev;
      delete document.body.dataset.sheet;
    };
  }, [open]);

  const tier = tiers.find((t) => t.id === tierId) ?? null;
  const leftFor = (t: FlowTier) => (t.left ? t.left[day] ?? null : null);
  const max = tier ? Math.max(0, Math.min(tier.perOrderMax, leftFor(tier) ?? tier.perOrderMax)) : 1;
  const subtotal = tier ? tier.price * qty : 0;
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
  const mode = total === 0 ? "free" : (event.bookingMode === "upi" && !event.upiReady) || event.bookingMode === "whatsapp" ? "request" : event.bookingMode;

  const go = (s: Step) => {
    setDir(ORDER.indexOf(s) >= ORDER.indexOf(step) ? 1 : -1);
    setStep(s);
  };
  const openTheatre = () => {
    setDone(null);
    setStep("tickets");
    setOpen(true);
    track("begin_checkout", { label: event.title });
  };
  const close = () => {
    setOpen(false);
    if (done) router.refresh();
  };
  const back = () => {
    if (step === "tickets" || step === "done") return close();
    if (step === "wait") return go("tickets");
    if (step === "processing") return;
    if (step === "photo") return go("details");
    go(ORDER[ORDER.indexOf(step) - 1]);
  };

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
    if (step === "review" && promoInput && (!promo || promo.key !== quoteKey)) applyPromo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, quoteKey]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = "Tell us your name";
    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) e.phone = "10-digit Indian mobile number";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Your tickets are sent here";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

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

  // Turn on push updates quietly (best-effort — never blocks the booking).
  async function enableUpdates() {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || Notification.permission === "denied") return;
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      const perm = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (perm !== "granted") return;
      const { key } = await (await fetch("/api/push/key")).json();
      if (!key) return;
      const pad = "=".repeat((4 - (key.length % 4)) % 4);
      const raw = atob((key + pad).replace(/-/g, "+").replace(/_/g, "/"));
      const appKey = Uint8Array.from(raw, (c) => c.charCodeAt(0));
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey }));
      const j = sub.toJSON();
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }) });
    } catch {
      /* ignore */
    }
  }

  async function uploadPhotos(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const added: string[] = [];
    for (const f of [...files].slice(0, 4 - photos.length)) {
      try {
        const body = new FormData();
        body.append("file", f);
        const res = await fetch("/api/verify-photo", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        added.push(data.url);
      } catch (e) {
        toast(e instanceof Error ? e.message : "Upload failed", "err");
      }
    }
    if (added.length) setPhotos((p) => [...p, ...added].slice(0, 4));
    setUploading(false);
  }

  async function submit() {
    if (!tier || !validate()) return;
    setBusy(true);
    go("processing");
    try {
      const [res] = await Promise.all([
        fetch("/api/orders", {
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
            photos: photos.length ? photos : undefined,
          }),
        }),
        new Promise((r) => setTimeout(r, 1200)), // let the ring breathe
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      track("order_created", { value: total, label: event.title });
      playConfirm();
      if (wantUpdates) enableUpdates();
      setDone({ code: data.code, url: data.url, mode: data.mode, account: data.account ?? null, qr: data.qr ?? null, verifying: Boolean(data.verifying) });
      setDir(1);
      setStep("done");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't book — try again", "err");
      setDir(-1);
      setStep("review");
    } finally {
      setBusy(false);
    }
  }

  async function invite() {
    const url = `${window.location.origin}/b/${event.slug}`;
    try {
      if (navigator.share) return await navigator.share({ title: event.title, text: `I'm going to ${event.title} — book yours:`, url });
    } catch {
      return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`I'm going to ${event.title} — book yours: ${url}`)}`, "_blank", "noopener");
  }

  async function downloadTicket() {
    if (!done?.qr || !tier) return;
    try {
      const W = 1080, H = 1640, PAD = 64, TW = W - PAD * 2, TH = H - PAD * 2, CUT = 860;
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const g = cv.getContext("2d")!;
      const grad = g.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#2a0a3d");
      grad.addColorStop(1, "#08080a");
      g.fillStyle = grad;
      g.fillRect(0, 0, W, H);
      g.save();
      g.translate(PAD, PAD);
      g.fillStyle = "#fff";
      g.fill(new Path2D(ticketPath(TW, TH, CUT, 56, 34)));
      const img = new window.Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(done.qr);
      await img.decode();
      g.drawImage(img, (TW - 640) / 2, 110, 640, 640);
      g.setLineDash([22, 18]);
      g.strokeStyle = "#d4d4da";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(60, CUT);
      g.lineTo(TW - 60, CUT);
      g.stroke();
      g.setLineDash([]);
      const fam = getComputedStyle(document.body).fontFamily;
      g.fillStyle = "#8a8a93";
      g.font = `600 34px ${fam}`;
      g.fillText("EVENT", 70, CUT + 90);
      g.fillStyle = "#111";
      g.font = `800 62px ${fam}`;
      g.fillText(event.title.length > 26 ? event.title.slice(0, 25) + "…" : event.title, 70, CUT + 170);
      g.fillStyle = "#55555c";
      g.font = `600 38px ${fam}`;
      g.fillText(`${event.venueName}`.slice(0, 40), 70, CUT + 240);
      g.fillText(`${dayLabel(day)}${event.timeText ? ` · ${event.timeText}` : ""}`, 70, CUT + 296);
      g.fillStyle = "#111";
      g.font = `800 50px ${fam}`;
      g.fillText(`${tier.name} × ${qty}`, 70, CUT + 400);
      g.fillStyle = "#e4113c";
      g.font = `800 72px ${fam}`;
      g.fillText(rs(total), 70, CUT + 490);
      g.fillStyle = "#111";
      g.font = `800 40px ${fam}`;
      g.fillText(done.code, TW - 70 - g.measureText(done.code).width, CUT + 490);
      g.restore();
      const blob: Blob = await new Promise((r) => cv.toBlob((b) => r(b!), "image/png"));
      const file = new File([blob], `syncout-${done.code}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) return await navigator.share({ files: [file], title: event.title });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: file.name });
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch {
      toast("Couldn't save the image — your ticket is always in Passes", "err");
    }
  }

  /* ── page CTA ── */
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

  const t0 = tile(day);
  const bar: { label: string; pill?: string; can: boolean; run: () => void } | null =
    step === "tickets"
      ? { label: tier ? "Continue" : "Pick a ticket", pill: tier ? rs(tier.price) : undefined, can: Boolean(tier) && max > 0 && saleState(tier!) === "on", run: () => go("qty") }
      : step === "qty"
        ? { label: "Continue", pill: rs(subtotal), can: qty >= 1 && qty <= max, run: () => go("details") }
        : step === "details"
          ? { label: needsPhoto ? "Add a photo" : "Review", pill: needsPhoto ? undefined : rs(subtotal), can: true, run: () => validate() && go(needsPhoto ? "photo" : "review") }
          : step === "photo"
            ? { label: "Review", can: photos.length > 0, run: () => go("review") }
          : step === "review"
            ? { label: needsPhoto ? "Join the list" : mode === "upi" ? "Book & pay" : "Book now", pill: needsPhoto ? undefined : rs(total), can: !busy, run: submit }
            : step === "wait" && !waitDone
              ? { label: `Notify me · ${qty}`, can: !busy, run: joinWaitlist }
              : null;

  return (
    <>
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+96px)] z-20 mt-7 flex justify-center px-5 lg:static lg:px-0">
        <button onClick={openTheatre} className="party-cta flex h-14 w-full max-w-[440px] items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-[0_14px_36px_-12px_rgba(228,17,60,.8)]">
          <Ticket className="size-4" /> Book tickets {from ? `· from ${rs(from)}` : "· free"}
          <ArrowRight className="size-4" />
        </button>
      </div>

      <Portal>
        <AnimatePresence>
          {open && (
            <>
              <motion.div className="fixed inset-0 z-[69] hidden bg-black/70 backdrop-blur-sm lg:block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
              <motion.section
                role="dialog"
                aria-label={`Book ${event.title}`}
                className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#07070a] text-white lg:inset-auto lg:left-1/2 lg:top-1/2 lg:h-[88vh] lg:max-h-[860px] lg:w-[460px] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-[32px] lg:border lg:border-white/10"
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 48 }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
              >
                {/* the poster, fading into the dark where the tickets float */}
                <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[48%] overflow-hidden">
                  {event.poster && <Image src={event.poster} alt="" fill sizes="460px" className="object-cover opacity-85" />}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-[#07070a]/55 to-[#07070a]" />
                </div>

                <header className="relative z-10 flex items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
                  <button onClick={back} aria-label="Back" disabled={step === "processing"} className="grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur">
                    <ArrowLeft className="size-5" />
                  </button>
                  <button onClick={close} aria-label="Close" className="ml-auto grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur">
                    <X className="size-5" />
                  </button>
                </header>

                {(step === "tickets" || step === "wait") && (
                  <motion.div className="relative z-10 px-5 pt-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-start gap-3">
                      <span className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-b from-[#ff2bd6] to-[#e4113c] px-3 py-1.5 text-center leading-none shadow-lg">
                        <span className="text-[10.5px] font-bold tracking-wider">{t0.mon}</span>
                        <span className="mt-0.5 font-display text-[24px] font-extrabold">{t0.date}</span>
                      </span>
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 font-display text-[25px] font-extrabold leading-[1.05] tracking-tight">{event.title}</h2>
                        <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-white/75"><MapPin className="size-3.5" /> <span className="truncate">{event.venueName}{event.cityLabel ? `, ${event.cityLabel}` : ""}</span></p>
                        {event.timeText && <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/75"><Clock className="size-3.5" /> {event.timeText}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
                  <AnimatePresence mode="popLayout" custom={dir} initial={false}>
                    {step === "tickets" && (
                      <motion.div key="tickets" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="pt-4">
                        {event.days.length > 1 && (
                          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1">
                            {event.days.map((d) => (
                              <motion.button
                                key={d}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => {
                                  setDay(d);
                                  setQty(1);
                                }}
                                className={cn("shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors", d === day ? "bg-white text-[#111]" : "bg-white/10 text-white/80")}
                              >
                                {dayLabel(d)}
                              </motion.button>
                            ))}
                          </div>
                        )}
                        <p className="px-5 pt-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-white/55">Choose your ticket</p>
                        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-8 pt-4">
                          {tiers.map((t, i) => {
                            const left = leftFor(t);
                            const soldOut = left !== null && left <= 0;
                            const sale = saleState(t);
                            const unavailable = soldOut || sale !== "on";
                            const sel = t.id === tierId && !unavailable;
                            return (
                              <motion.div
                                key={t.id}
                                className="shrink-0 snap-center"
                                initial={{ x: 140, opacity: 0, rotate: 5 }}
                                animate={{ x: 0, opacity: 1, rotate: 0, scale: sel || !tierId ? 1 : 0.95 }}
                                transition={{ type: "spring", damping: 20, stiffness: 190, delay: 0.08 + i * 0.08 }}
                              >
                                <button
                                  disabled={unavailable}
                                  onClick={() => {
                                    setTierId(t.id);
                                    setQty(1);
                                  }}
                                  className="block text-left disabled:cursor-not-allowed"
                                >
                                  <TicketShape layoutId={sel ? `tk-${t.id}` : undefined} cut={(h) => h * 0.62} selected={sel} className={cn("h-[292px] w-[212px] transition-opacity", unavailable && "opacity-80")}>
                                    <div className="flex h-[292px] flex-col p-5 text-[#111]">
                                      <div className="flex items-start justify-between">
                                        <span className="text-[11.5px] font-medium text-[#8a8a93]">Type</span>
                                        <span className={cn("grid size-6 place-items-center rounded-full border-2", sel ? "border-transparent bg-gradient-to-br from-[#ff2bd6] to-[#ff8a00]" : "border-[#d0d0d6]")}>
                                          <AnimatePresence>{sel && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="size-3.5 text-white" strokeWidth={3} /></motion.span>}</AnimatePresence>
                                        </span>
                                      </div>
                                      <p className="mt-1 line-clamp-2 font-display text-[27px] font-extrabold leading-[1.02] tracking-tight">{t.name}</p>
                                      {t.badge && <span className="mt-2 self-start rounded-md bg-[#fff1cc] px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-[#a06a00]">{t.badge}</span>}
                                      <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-snug text-[#6b6b74]">{t.description || (t.admits > 1 ? `Admits ${t.admits}` : "Admits 1")}</p>
                                      <div className="mt-auto pt-6">
                                        <span className="text-[11.5px] font-medium text-[#8a8a93]">Price</span>
                                        <div className="flex items-end gap-2">
                                          <span className="bg-gradient-to-r from-[#e4113c] to-[#ff2bd6] bg-clip-text font-display text-[30px] font-extrabold leading-none text-transparent">{rs(t.price)}</span>
                                          {t.compareAtPrice && t.compareAtPrice > t.price && <span className="pb-0.5 text-[12px] text-[#9a9aa3] line-through">{rs(t.compareAtPrice)}</span>}
                                        </div>
                                        <p className="mt-1 text-[11px] font-bold">
                                          {sale === "soon" && t.salesStartAt ? (
                                            <Countdown until={t.salesStartAt} prefix="Opens in" className="text-[#6b6b74]" />
                                          ) : soldOut ? (
                                            <span className="text-[#e4113c]">Sold out</span>
                                          ) : sale === "on" && t.salesEndAt ? (
                                            <Countdown until={t.salesEndAt} prefix="Price ends in" className="text-[#c4128f]" />
                                          ) : left !== null && left < 40 ? (
                                            <span className="text-[#1fa45a]">{left} left</span>
                                          ) : null}
                                        </p>
                                      </div>
                                    </div>
                                    {(soldOut || sale === "ended") && (
                                      <span className="absolute right-3 top-[40%] -rotate-[14deg] rounded-md border-[3px] border-[#e4113c] px-2 py-0.5 font-display text-[19px] font-extrabold tracking-wider text-[#e4113c] opacity-90">
                                        {soldOut ? "SOLD OUT" : "ENDED"}
                                      </span>
                                    )}
                                  </TicketShape>
                                </button>
                                {soldOut && sale === "on" && (
                                  <button
                                    onClick={() => {
                                      setWait({ tierId: t.id, tierName: t.name });
                                      setWaitDone(false);
                                      setDir(1);
                                      setStep("wait");
                                    }}
                                    className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-white/10 py-2 text-[12.5px] font-semibold"
                                  >
                                    <BellRing className="size-3.5 text-[#ff6ad5]" /> Join the waitlist
                                  </button>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {step === "qty" && tier && (
                      <motion.div key="qty" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="px-5 pt-5">
                        <TicketShape layoutId={`tk-${tier.id}`} cut={(h) => h * 0.56} className="mx-auto w-full max-w-[360px]">
                          <div className="p-5 text-[#111]">
                            <span className="text-[11.5px] font-medium text-[#8a8a93]">Event</span>
                            <p className="mt-0.5 line-clamp-2 font-display text-[21px] font-extrabold leading-tight">{event.title}</p>
                            <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#55555c]"><MapPin className="size-3.5 text-[#e4113c]" /> <span className="truncate">{event.venueName}</span></p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[#55555c]"><Clock className="size-3.5 text-[#e4113c]" /> {dayLabel(day)}{event.timeText ? `, ${event.timeText}` : ""}</p>
                            <div className="mt-9 text-center">
                              <p className="font-display text-[22px] font-extrabold">
                                {tier.name} <span className="text-[#7c4dff]">× {qty}</span>
                              </p>
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.p key={subtotal} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="font-display text-[34px] font-extrabold leading-tight text-[#e4113c]">
                                  {rs(subtotal)}
                                </motion.p>
                              </AnimatePresence>
                            </div>
                          </div>
                        </TicketShape>
                        <div className="mt-9 flex items-center justify-center gap-9">
                          <motion.button whileTap={{ scale: 0.85 }} aria-label="One less" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-16 place-items-center rounded-full bg-white/10 disabled:opacity-30">
                            <Minus className="size-7" />
                          </motion.button>
                          <span className="min-w-[60px] text-center font-display text-[84px] font-extrabold leading-none">
                            <RollingNumber value={qty} pad={1} />
                          </span>
                          <motion.button whileTap={{ scale: 0.85 }} aria-label="One more" disabled={qty >= max} onClick={() => setQty((q) => Math.min(max, q + 1))} className="grid size-16 place-items-center rounded-full bg-white/10 disabled:opacity-30">
                            <Plus className="size-7" />
                          </motion.button>
                        </div>
                        <p className="mt-4 text-center text-[12px] text-white/50">
                          {tier.admits > 1 ? `Each admits ${tier.admits} · ` : ""}Up to {max} per booking
                        </p>
                      </motion.div>
                    )}

                    {step === "details" && (
                      <motion.div key="details" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="px-5 pt-5">
                        <h3 className="font-display text-[24px] font-extrabold">Who&apos;s booking?</h3>
                        <p className="mt-1 text-[13px] text-white/60">Your QR and updates go here. We never share your number.</p>
                        <div className="mt-5 space-y-3.5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                          <Input label="Full name" value={form.name} onChange={set("name")} error={errors.name || undefined} autoComplete="name" />
                          <Input label="Mobile" inputMode="numeric" placeholder="98XXXXXXXX" value={form.phone} onChange={set("phone")} error={errors.phone || undefined} autoComplete="tel" />
                          <Input label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email || undefined} autoComplete="email" />
                          <Textarea label="Anything we should know? (optional)" value={form.note} onChange={set("note")} />
                        </div>
                        <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                          <input type="checkbox" checked={wantUpdates} onChange={(e) => setWantUpdates(e.target.checked)} className="mt-0.5 size-4 accent-[#ff2bd6]" />
                          <span className="min-w-0 text-[13px] leading-snug text-white/75"><b className="text-white">Keep me updated on SyncOut</b> — new launches, drops and offers. Tap to allow notifications after you book.</span>
                        </label>
                      </motion.div>
                    )}

                    {step === "photo" && (
                      <motion.div key="photo" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="px-5 pt-5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-wide text-gold"><ShieldCheck className="size-3.5" /> Guestlist verification</span>
                        <h3 className="mt-3 font-display text-[24px] font-extrabold leading-tight">Add a photo to join the list</h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-white/65">{event.verificationNote || "Upload a clear photo so our team can confirm your spot. It's free — you'll hear back soon."}</p>
                        <div className="mt-5 grid grid-cols-3 gap-2.5">
                          {photos.map((url, i) => (
                            <div key={url + i} className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-white/5">
                              <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                              <button onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))} aria-label="Remove" className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/70 text-white"><X className="size-3.5" /></button>
                            </div>
                          ))}
                          {photos.length < 4 && (
                            <label className="grid aspect-[3/4] cursor-pointer place-items-center rounded-2xl border border-dashed border-white/20 text-white/60">
                              {uploading ? (
                                <span className="flex flex-col items-center gap-1 text-[11.5px]"><Loader2 className="size-5 animate-spin" /> Uploading…</span>
                              ) : (
                                <span className="flex flex-col items-center gap-1 text-[11.5px]"><ImagePlus className="size-6" /> Add photo</span>
                              )}
                              <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" multiple hidden onChange={(e) => uploadPhotos(e.target.files)} />
                            </label>
                          )}
                        </div>
                        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/[0.04] p-3 text-[12px] leading-relaxed text-white/55"><Camera className="mt-0.5 size-4 shrink-0 text-gold" /> Your photo is used once, only to confirm your spot.{tier && tier.admits > 1 ? " A photo of both of you is ideal." : ""} Entries are subject to selection.</p>
                      </motion.div>
                    )}

                    {step === "review" && tier && (
                      <motion.div key="review" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="px-5 pt-5">
                        <TicketShape cut={(h) => h - 118} className="mx-auto w-full max-w-[380px]">
                          <div className="p-5 text-[#111]">
                            <p className="line-clamp-2 font-display text-[19px] font-extrabold leading-tight">{event.title}</p>
                            <p className="mt-1 text-[12.5px] text-[#55555c]">{dayLabel(day)}{event.timeText ? `, ${event.timeText}` : ""} · {event.venueName}</p>
                            <dl className="mt-4 space-y-1.5 text-[13px]">
                              <div className="flex justify-between"><dt className="text-[#6b6b74]">{tier.name} × {qty}</dt><dd className="font-semibold">{rs(subtotal)}</dd></div>
                              {discount > 0 && <div className="flex justify-between text-[#1fa45a]"><dt>Code {promo?.code}</dt><dd className="font-semibold">−{rs(discount)}</dd></div>}
                              <div className="flex justify-between"><dt className="text-[#6b6b74]">Name</dt><dd className="truncate pl-4 font-semibold">{form.name}</dd></div>
                              <div className="flex justify-between"><dt className="text-[#6b6b74]">Mobile</dt><dd className="font-semibold">{form.phone}</dd></div>
                            </dl>
                            <div className="mt-[38px] flex items-end justify-between">
                              <span className="text-[12px] font-medium text-[#8a8a93]">Total</span>
                              <span className="font-display text-[32px] font-extrabold leading-none text-[#e4113c]">{rs(total)}</span>
                            </div>
                          </div>
                        </TicketShape>

                        <div className="mx-auto mt-4 max-w-[380px] rounded-[20px] border border-dashed border-white/15 p-3">
                          {discount > 0 ? (
                            <div className="flex items-center gap-2 text-[13px]">
                              <TicketPercent className="size-4 shrink-0 text-gold" />
                              <span className="min-w-0 flex-1 truncate"><b>{promo?.label}</b> — you save {rs(discount)}</span>
                              <button onClick={() => { setPromo(null); setPromoInput(""); try { localStorage.removeItem("so_promo"); } catch {} }} className="text-[12px] text-white/60 underline">Remove</button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <TicketPercent className="size-4 shrink-0 text-white/40" />
                              <input
                                value={promoInput}
                                onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoErr(null); }}
                                placeholder="Promo code"
                                className="h-9 min-w-0 flex-1 bg-transparent text-[16px] uppercase outline-none placeholder:normal-case placeholder:text-white/35"
                              />
                              <Button size="sm" variant="ghost" loading={checking} disabled={!promoInput.trim()} onClick={() => applyPromo()}>Apply</Button>
                            </div>
                          )}
                          {promoErr && <p className="mt-1.5 text-[12px] text-red-hot">{promoErr}</p>}
                        </div>
                        <div className="mx-auto mt-3 max-w-[380px] text-[12.5px] leading-relaxed text-white/60">
                          {needsPhoto ? (
                            <p className="flex gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-gold" /> We&apos;ll review your photo and confirm your spot — usually within the hour. You&apos;ll get a notification and your entry QR the moment you&apos;re approved.</p>
                          ) : mode === "upi" ? (
                            <p>Next you&apos;ll see a UPI QR for {rs(total)} — pay from any UPI app and add the reference.</p>
                          ) : mode === "free" ? (
                            <p>This one&apos;s free — we&apos;ll confirm your spot shortly.</p>
                          ) : (
                            <p className="flex gap-2"><BadgeCheck className="mt-0.5 size-4 shrink-0 text-gold" /> No payment step now — your booking goes straight to the SyncOut team and your QR is ready instantly.</p>
                          )}
                          <p className="mt-2 text-[11.5px] text-white/40">
                            By booking you agree to the <a href="/terms" target="_blank" className="underline">Terms</a> and <a href="/refunds" target="_blank" className="underline">Refund policy</a>.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {step === "processing" && (
                      <motion.div key="processing" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} className="grid h-full min-h-[420px] place-items-center">
                        <div className="flex flex-col items-center">
                          <div className="relative grid size-[150px] place-items-center">
                            <svg viewBox="0 0 120 120" className="absolute inset-0 size-full" aria-hidden>
                              <defs>
                                <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
                                  <stop offset="0" stopColor="#ff2bd6" />
                                  <stop offset="1" stopColor="#ff8a00" />
                                </linearGradient>
                              </defs>
                              <circle cx={60} cy={60} r={52} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={6} />
                              <motion.circle
                                cx={60}
                                cy={60}
                                r={52}
                                fill="none"
                                stroke="url(#ring-g)"
                                strokeWidth={6}
                                strokeLinecap="round"
                                style={{ originX: "50%", originY: "50%" }}
                                initial={{ pathLength: 0.08, rotate: -90 }}
                                animate={{ pathLength: [0.08, 0.8, 0.08], rotate: [-90, 270] }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                              />
                            </svg>
                            <motion.span animate={{ rotate: [-10, 10, -10], y: [0, -4, 0] }} transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}>
                              <Ticket className="size-12 text-[#ff6ad5]" strokeWidth={1.8} />
                            </motion.span>
                          </div>
                          <p className="mt-6 text-[15px] font-semibold">Booking your tickets…</p>
                          <p className="mt-1 text-[12.5px] text-white/50">Holding {qty} {qty === 1 ? "spot" : "spots"} for you</p>
                        </div>
                      </motion.div>
                    )}

                    {step === "done" && done && tier && (
                      <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative px-5 pb-6 pt-2">
                        <Burst />
                        <motion.div initial={{ y: -60, opacity: 0, rotate: -4 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: "spring", damping: 15, stiffness: 170, delay: 0.1 }}>
                          <TicketShape cut={(h) => h * 0.5} className="mx-auto w-full max-w-[340px]">
                            <div className="p-5 text-center text-[#111]">
                              {done.qr ? (
                                <div className="mx-auto w-[172px] [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: done.qr }} />
                              ) : (
                                <p className="font-display text-[28px] font-extrabold tracking-[0.16em]">{done.code}</p>
                              )}
                              <p className="mt-1 font-display text-[14px] font-extrabold tracking-[0.22em] text-[#55555c]">{done.code}</p>
                              <div className="mt-8 text-left">
                                <span className="text-[11.5px] font-medium text-[#8a8a93]">Event</span>
                                <p className="line-clamp-2 font-display text-[18px] font-extrabold leading-tight">{event.title}</p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#55555c]"><MapPin className="size-3.5 text-[#e4113c]" /> <span className="truncate">{event.venueName}</span></p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[#55555c]"><Clock className="size-3.5 text-[#e4113c]" /> {dayLabel(day)}{event.timeText ? `, ${event.timeText}` : ""}</p>
                              </div>
                              <div className="mt-4 flex items-end justify-between">
                                <p className="font-display text-[17px] font-extrabold">{tier.name} <span className="text-[#7c4dff]">× {qty}</span></p>
                                <p className="font-display text-[24px] font-extrabold leading-none text-[#e4113c]">{rs(total)}</p>
                              </div>
                              <p className="mt-3 rounded-full bg-[#fff6dc] px-3 py-1.5 text-[11.5px] font-bold text-[#8a5a00]">
                                {done.verifying ? "Pending verification — we'll confirm soon" : done.mode === "upi" ? "Pay by UPI next to confirm" : done.mode === "free" ? "You're on the list" : "Booking received — confirming now"}
                              </p>
                            </div>
                          </TicketShape>
                        </motion.div>
                        <motion.div className="mx-auto mt-5 max-w-[340px] space-y-2.5" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                          <button onClick={() => router.push(done.url)} className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] text-[15px] font-bold shadow-[0_18px_40px_-16px_rgba(228,17,60,.9)]">
                            <Ticket className="size-5" /> {done.mode === "upi" ? "Pay & view ticket" : "View my ticket"}
                          </button>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={downloadTicket} className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-white/10 text-[13.5px] font-semibold"><Download className="size-4" /> Download</button>
                            <button onClick={invite} className="flex h-12 items-center justify-center gap-2 rounded-[16px] bg-white/10 text-[13.5px] font-semibold"><Share2 className="size-4" /> Invite friends</button>
                          </div>
                          <button onClick={close} className="w-full py-2 text-[13.5px] font-semibold text-white/60">Close</button>
                          {done.account && (
                            <p className="text-center text-[12px] leading-relaxed text-white/55">
                              {done.account === "created"
                                ? "Saved to your new SyncOut account — you're logged in, so this ticket and its status are always in Passes."
                                : done.account === "existing"
                                  ? `Saved to the SyncOut account for ${form.email.trim()}. Log in to see it in Passes.`
                                  : "Saved to your Passes."}
                            </p>
                          )}
                        </motion.div>
                      </motion.div>
                    )}

                    {step === "wait" && wait && (
                      <motion.div key="wait" custom={dir} variants={slide} initial="enter" animate="center" exit="exit" className="px-5 pt-5">
                        {waitDone ? (
                          <div className="py-10 text-center">
                            <BellRing className="mx-auto size-10 text-gold" />
                            <p className="mt-3 text-[17px] font-semibold">You&apos;re on the waitlist</p>
                            <p className="mx-auto mt-1 max-w-[30ch] text-[13px] text-white/60">
                              If {wait.tierName} opens up for {dayLabel(day)}, you&apos;ll hear first{user ? " — in the app too" : ""}.
                            </p>
                            <Button variant="ghost" className="mt-5" onClick={() => go("tickets")}>See other tickets</Button>
                          </div>
                        ) : (
                          <div className="space-y-3.5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-[13px] leading-relaxed text-white/70">
                              <b className="text-white">{wait.tierName}</b> is sold out for {dayLabel(day)}. Leave your number — when spots free up, the waitlist hears first.
                            </p>
                            <Input label="Full name" value={form.name} onChange={set("name")} error={errors.name || undefined} autoComplete="name" />
                            <Input label="Mobile" inputMode="numeric" value={form.phone} onChange={set("phone")} error={errors.phone || undefined} autoComplete="tel" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {bar && (
                  <div className="relative z-10 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={!bar.can}
                      onClick={bar.run}
                      className="flex h-[58px] w-full items-center gap-3 rounded-[20px] bg-gradient-to-r from-[#ff2bd6] via-[#e4113c] to-[#ff8a00] pl-4 pr-2 text-white shadow-[0_18px_40px_-16px_rgba(228,17,60,.9)] transition-opacity disabled:opacity-45"
                    >
                      <Ticket className="size-5 shrink-0" />
                      <span className="flex-1 text-center text-[16px] font-bold">{bar.label}</span>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {bar.pill ? (
                          <motion.span key={bar.pill} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} className="grid h-[42px] min-w-[86px] place-items-center rounded-[14px] bg-white/20 px-3 text-[15px] font-extrabold">
                            {bar.pill}
                          </motion.span>
                        ) : (
                          <span className="w-[42px]" />
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                )}
              </motion.section>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

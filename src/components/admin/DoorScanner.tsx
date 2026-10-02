"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Search, ScanLine, CameraOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type Result = {
  kind: "pass" | "ticket";
  id: string;
  code: string;
  status: string;
  ok: boolean;
  guestName: string;
  guestPhone: string;
  totalGuests: number;
  detail: string;
  eventTitle: string;
  clubName: string;
} | null;

/** Guestlist passes (6 characters) and event tickets (7, starting with T). */
/** Pull a code out of whatever the QR held: our door link, or a bare code. */
function codeFrom(text: string) {
  try {
    const u = new URL(text);
    const c = u.searchParams.get("code");
    if (c) return c.toUpperCase().replace(/[^A-Z0-9]/g, "");
  } catch {}
  return text.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-7);
}

export function DoorScanner({ initialCode }: { initialCode?: string }) {
  const toast = useToast();
  const [code, setCode] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result>(null);
  const [miss, setMiss] = useState(false);
  const [scanning, setScanning] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (initialCode) find(initialCode);
    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopScan() {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setScanning(false);
  }

  async function startScan() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
      stream.current = s;
      setScanning(true);
      const jsQR = (await import("jsqr")).default;
      await new Promise((r) => requestAnimationFrame(() => r(null))); // let the <video> mount
      const v = video.current;
      if (!v) throw new Error("no video element");
      v.srcObject = s;
      await v.play();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
      const tick = () => {
        if (!stream.current) return;
        if (v.readyState >= 2 && v.videoWidth) {
          const w = 480;
          const h = Math.round((v.videoHeight / v.videoWidth) * w);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(v, 0, 0, w, h);
          const hit = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" });
          if (hit?.data) {
            const c = codeFrom(hit.data);
            if (c.length >= 6) {
              navigator.vibrate?.(60);
              stopScan();
              setCode(c);
              find(c);
              return;
            }
          }
        }
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
    } catch {
      stopScan();
      toast("Camera blocked — allow camera access, or type the code", "err");
    }
  }

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    await find(code);
  }

  async function find(raw: string) {
    const c = raw.trim().toUpperCase();
    if (c.length < 4) return;
    setBusy(true);
    setMiss(false);
    try {
      const r = await fetch(`/api/door/${c}`);
      if (r.status === 404) {
        setRes(null);
        setMiss(true);
        return;
      }
      setRes(await r.json());
    } finally {
      setBusy(false);
    }
  }

  async function checkIn() {
    if (!res) return;
    setBusy(true);
    try {
      const url = res.kind === "ticket" ? `/api/admin/orders/${res.id}` : `/api/admin/bookings/${res.id}`;
      const r = await fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "checked_in" }) });
      if (!r.ok) throw new Error("Check-in failed");
      setRes({ ...res, status: "checked_in" });
      toast(`${res.guestName} checked in`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-5">
      <form onSubmit={lookup} className="flex gap-2.5">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={8}
          autoCapitalize="characters"
          className="h-14 flex-1 rounded-2xl border border-line bg-raised px-4 text-center font-display text-[24px] font-bold tracking-[0.18em] placeholder:text-faint placeholder:tracking-[0.18em] focus:border-red/60"
        />
        <Button type="submit" size="lg" loading={busy} aria-label="Look up code">
          <Search className="size-4" />
        </Button>
      </form>

      <div className="mt-3">
        {scanning ? (
          <div className="relative overflow-hidden rounded-[22px] border border-gold/40 bg-black">
            <video ref={video} playsInline muted className="aspect-[4/3] w-full object-cover" />
            <motion.div className="pointer-events-none absolute inset-x-6 h-0.5 bg-gold shadow-[0_0_14px_rgba(242,193,78,.9)]" animate={{ top: ["15%", "85%", "15%"] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />
            <button onClick={stopScan} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-[12.5px] font-semibold"><CameraOff className="size-3.5" /> Stop</button>
          </div>
        ) : (
          <Button full size="lg" variant="gold" onClick={startScan}><ScanLine className="size-4" /> Scan QR with camera</Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {miss && (
          <motion.p key="miss" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-5 rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[14px] text-muted">
            No pass or ticket with that code.
          </motion.p>
        )}
        {res && (
          <motion.div
            key={res.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mt-5 overflow-hidden rounded-[22px] border ${res.ok ? "border-gold/45 bg-gold/[0.06]" : "border-red/40 bg-red/[0.06]"}`}
          >
            <div className="p-5">
              <div className="flex items-center justify-between">
                <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${res.ok ? "text-gold" : "text-red-hot"}`}>
                  {res.ok ? <Check className="size-4" /> : <X className="size-4" />}
                  {res.status === "checked_in" ? "Already checked in" : res.ok ? (res.kind === "ticket" ? "Paid ticket — let them in" : "On the list") : res.status.replace("_", " ")}
                </span>
                <span className="rounded-md bg-raised px-1.5 py-0.5 text-[11px] font-semibold text-muted">{res.kind === "ticket" ? "Event ticket" : "Guestlist"}</span>
              </div>
              <p className="mt-3 font-display text-[26px] font-extrabold leading-tight">{res.guestName}</p>
              <p className="mt-1 text-[13.5px] text-muted">
                {res.totalGuests} {res.totalGuests === 1 ? "person" : "people"} · {res.detail}
              </p>
              <p className="mt-1 text-[12.5px] text-faint">
                {res.eventTitle} · {res.clubName} · {res.guestPhone}
              </p>
            </div>
            {res.ok && res.status !== "checked_in" && (
              <div className="border-t border-line p-3">
                <Button full size="lg" variant="gold" loading={busy} onClick={checkIn}>
                  Check in {res.totalGuests > 1 ? `all ${res.totalGuests}` : ""}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { BellRing, BellOff, Smartphone } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

const KEY = "so_admin_push";
type State = "loading" | "on" | "off" | "blocked" | "install" | "unsupported";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Turns on a phone/laptop notification for every new booking — for the admin's installed app. */
export function AdminAlertsToggle({ compact = false }: { compact?: boolean }) {
  const toast = useToast();
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return setState(ios && !standalone ? "install" : "unsupported");
      if (Notification.permission === "denied") return setState("blocked");
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      setState(sub && localStorage.getItem(KEY) === sub.endpoint ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "blocked" : "off");
      const { key } = await (await fetch("/api/push/key")).json();
      if (!key) throw new Error("Push isn't set up yet — add VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on Vercel");
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
      const json = sub.toJSON();
      const r = await fetch("/api/admin/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, label: navigator.userAgent.slice(0, 120) }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? "Couldn't save this device");
      localStorage.setItem(KEY, sub.endpoint);
      setState("on");
      await fetch("/api/admin/push/test", { method: "POST" });
      toast("Booking alerts on — a test notification is on its way");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't turn alerts on", "err");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const endpoint = localStorage.getItem(KEY);
      if (endpoint) await fetch("/api/admin/push/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) });
      localStorage.removeItem(KEY);
      setState("off");
      toast("Booking alerts off on this device");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;
  if (state === "install")
    return compact ? null : (
      <p className="flex items-start gap-2 rounded-xl bg-raised p-3 text-[12px] leading-relaxed text-muted">
        <Smartphone className="mt-0.5 size-4 shrink-0 text-gold" />
        For alerts on iPhone: Share → Add to Home Screen, open SyncOut Admin from there, then turn alerts on.
      </p>
    );
  if (state === "blocked")
    return compact ? null : <p className="rounded-xl bg-raised p-3 text-[12px] text-muted">Notifications are blocked for this site — allow them in your browser settings.</p>;

  return (
    <button
      onClick={state === "on" ? disable : enable}
      disabled={busy}
      aria-label={state === "on" ? "Turn off booking alerts" : "Turn on booking alerts"}
      className={
        compact
          ? `relative grid size-9 place-items-center rounded-full border ${state === "on" ? "border-gold/50 text-gold" : "border-line text-muted"}`
          : `flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold ${state === "on" ? "border-gold/40 text-gold" : "border-line text-muted hover:text-text"}`
      }
    >
      {state === "on" ? <BellRing className="size-4" /> : <BellOff className="size-4" />}
      {!compact && (state === "on" ? "Booking alerts on" : "Turn on booking alerts")}
      {compact && state === "off" && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-red" />}
    </button>
  );
}

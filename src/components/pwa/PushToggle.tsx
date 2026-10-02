"use client";
import { useEffect, useState } from "react";
import { BellRing, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { usePwa } from "./PwaProvider";

function keyBytes(base64: string) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** "Turn on notifications" row — push alerts for approvals, tickets and announcements. */
export function PushToggle() {
  const toast = useToast();
  const { ios, installed } = usePwa();
  const [state, setState] = useState<"hidden" | "off" | "on" | "blocked" | "needs-install">("hidden");
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return setState(ios && !installed ? "needs-install" : "hidden");
      try {
        const res = await fetch("/api/push/key");
        const { key } = (await res.json()) as { key: string | null };
        if (!key) return setState("hidden");
        setKey(key);
        if (Notification.permission === "denied") return setState("blocked");
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        setState(sub ? "on" : "off");
      } catch {
        setState("hidden");
      }
    })();
  }, [ios, installed]);

  async function enable() {
    if (!key) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "blocked" : "off");
        return;
      }
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't turn on notifications");
      setState("on");
      toast("Notifications on — we'll ping you the moment you're approved");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't turn on notifications", "err");
    } finally {
      setBusy(false);
    }
  }

  if (state === "hidden") return null;

  const label =
    state === "on"
      ? "Notifications are on"
      : state === "blocked"
      ? "Notifications blocked in browser settings"
      : state === "needs-install"
      ? "Install the app to get alerts on iPhone"
      : "Turn on approval alerts";

  return (
    <button
      onClick={state === "off" ? enable : undefined}
      disabled={busy || state !== "off"}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-raised disabled:active:bg-transparent"
    >
      <span className={state === "on" ? "text-gold" : "text-muted"}>
        {busy ? <Loader2 className="size-[18px] animate-spin" /> : <BellRing className="size-[18px]" />}
      </span>
      <span className="flex-1 text-[14.5px]">{label}</span>
      {state === "off" && <ChevronRight className="size-4 text-faint" />}
    </button>
  );
}

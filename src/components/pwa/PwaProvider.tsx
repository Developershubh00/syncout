"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { track } from "@/lib/track";

type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
type Ctx = { canInstall: boolean; installed: boolean; ios: boolean; install: () => Promise<boolean> };

const PwaCtx = createContext<Ctx>({ canInstall: false, installed: false, ios: false, install: async () => false });
export const usePwa = () => useContext(PwaCtx);

/** Registers the service worker and keeps the browser's install prompt for our own button. */
export function PwaProvider({ children }: { children: React.ReactNode }) {
  const deferred = useRef<BIP | null>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const nav = navigator as Navigator & { standalone?: boolean };
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      deferred.current = e as BIP;
      setCanInstall(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setCanInstall(false);
      track("app_installed");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const e = deferred.current;
    if (!e) return false;
    await e.prompt();
    const { outcome } = await e.userChoice;
    deferred.current = null;
    setCanInstall(false);
    return outcome === "accepted";
  }, []);

  return <PwaCtx.Provider value={{ canInstall, installed, ios, install }}>{children}</PwaCtx.Provider>;
}

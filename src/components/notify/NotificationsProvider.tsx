"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPopup, type PopupPayload, type PopupKind } from "@/components/ui/StatusPopup";

type Note = { id: string; kind: string; title: string; body?: string | null; url?: string | null; popup?: boolean };
type Ctx = { unread: number; signedIn: boolean; clear: () => void };

const NotificationsCtx = createContext<Ctx>({ unread: 0, signedIn: false, clear: () => {} });
export const useNotifications = () => useContext(NotificationsCtx);

const KIND: Record<string, PopupKind> = {
  approved: "approved",
  confirmed: "approved",
  rejected: "rejected",
  waitlisted: "waitlisted",
  receipt: "submitted",
  broadcast: "info",
  info: "info",
};

function toPopup(n: Note): PopupPayload {
  return {
    kind: KIND[n.kind] ?? "info",
    title: n.title,
    body: n.body ?? undefined,
    cta: n.url ? { label: n.kind === "approved" || n.kind === "confirmed" ? "View pass" : "Open", href: n.url } : undefined,
  };
}

/**
 * Bell count + live popups for signed-in users. Catches up on unread
 * notifications when the app opens, then listens on an SSE stream that
 * closes while the tab is hidden (no cost for background tabs).
 */
export function NotificationsProvider({ signedIn, children }: { signedIn: boolean; children: React.ReactNode }) {
  const [unread, setUnread] = useState(0);
  const [popup, setPopup] = useState<PopupPayload | null>(null);
  const queue = useRef<Note[]>([]);
  const current = useRef<Note | null>(null);
  const seen = useRef<Set<string>>(new Set());
  const router = useRouter();

  const showNext = useCallback(() => {
    const n = queue.current.shift() ?? null;
    current.current = n;
    setPopup(n ? toPopup(n) : null);
  }, []);

  const enqueue = useCallback(
    (n: Note) => {
      if (seen.current.has(n.id)) return;
      seen.current.add(n.id);
      queue.current.push(n);
      if (!current.current) showNext();
    },
    [showNext]
  );

  const close = useCallback(() => {
    const n = current.current;
    if (n) {
      setUnread((u) => Math.max(0, u - 1));
      fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
        keepalive: true,
      }).catch(() => {});
    }
    showNext();
  }, [showNext]);

  const catchUp = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?popup=1", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Note[]; unread: number };
      setUnread(data.unread);
      data.items.forEach(enqueue);
    } catch {
      /* offline — the stream will catch up */
    }
  }, [enqueue]);

  useEffect(() => {
    if (!signedIn) return;
    catchUp();

    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = () => {
      if (stopped || document.hidden || es) return;
      es = new EventSource("/api/live/stream");
      es.addEventListener("notification", (e) => {
        try {
          const n = JSON.parse((e as MessageEvent).data) as Note;
          if (seen.current.has(n.id)) return;
          setUnread((u) => u + 1);
          if (n.popup !== false) enqueue(n);
          else seen.current.add(n.id);
          if (["approved", "rejected", "waitlisted", "confirmed"].includes(n.kind)) router.refresh();
        } catch {
          /* ignore a malformed frame */
        }
      });
      es.onerror = () => {
        es?.close();
        es = null;
        if (!stopped && !document.hidden) retry = setTimeout(connect, 3000);
      };
    };

    const onVisibility = () => {
      if (document.hidden) {
        es?.close();
        es = null;
        clearTimeout(retry);
      } else {
        catchUp();
        connect();
      }
    };

    connect();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stopped = true;
      clearTimeout(retry);
      es?.close();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [signedIn, catchUp, enqueue, router]);

  const clear = useCallback(() => setUnread(0), []);

  return (
    <NotificationsCtx.Provider value={{ unread, signedIn, clear }}>
      {children}
      <StatusPopup data={popup} onClose={close} />
    </NotificationsCtx.Provider>
  );
}

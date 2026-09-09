"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusPopup, type PopupPayload } from "@/components/ui/StatusPopup";

type Update = {
  id: string;
  code: string;
  status: string;
  reason?: string | null;
  eventTitle: string;
  clubName: string;
};

const SEEN_KEY = "syncout:seen-status";

function readSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || "{}");
  } catch {
    return {};
  }
}
function markSeen(id: string, status: string) {
  try {
    const s = readSeen();
    s[id] = status;
    localStorage.setItem(SEEN_KEY, JSON.stringify(s));
  } catch {
    /* private mode — popups just repeat, which is survivable */
  }
}

function toPopup(u: Update): PopupPayload | null {
  if (u.status === "approved")
    return {
      kind: "approved",
      title: "You're on the list",
      body: `${u.eventTitle} at ${u.clubName}. Show this code at the door.`,
      code: u.code,
      cta: { label: "View pass", href: `/passes/${u.code}` },
    };
  if (u.status === "rejected")
    return {
      kind: "rejected",
      title: "Not tonight",
      body: u.reason || `${u.clubName} couldn't fit this one in. There are other rooms on tonight.`,
      cta: { label: "Find another night", href: "/nights" },
    };
  if (u.status === "waitlisted")
    return {
      kind: "waitlisted",
      title: "You're on the waitlist",
      body: `${u.clubName} is full for now. We'll tell you the moment a spot opens.`,
    };
  return null;
}

export function LiveBookings({ signedIn }: { signedIn: boolean }) {
  const [popup, setPopup] = useState<PopupPayload | null>(null);
  const router = useRouter();
  const queue = useRef<PopupPayload[]>([]);
  const shownFor = useRef<Set<string>>(new Set());

  const push = useCallback((u: Update) => {
    // One announcement per booking per session, whichever channel finds it first.
    const key = u.id + ":" + u.status;
    if (shownFor.current.has(key)) return;
    shownFor.current.add(key);

    const p = toPopup(u);
    if (!p) return;
    markSeen(u.id, u.status);
    queue.current.push(p);
    setPopup((cur) => cur ?? queue.current.shift() ?? null);
  }, []);

  const next = useCallback(() => setPopup(queue.current.shift() ?? null), []);

  /* Catch up on anything decided while the tab was closed. */
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/live/catchup");
        if (!res.ok) return;
        const { decided } = (await res.json()) as { decided: Update[] };
        if (cancelled) return;
        const seen = readSeen();
        for (const d of decided) {
          if (seen[d.id] !== d.status) push(d);
        }
      } catch {
        /* offline — the stream will catch it later */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [signedIn, push]);

  /* Live stream for decisions made while you're watching. */
  useEffect(() => {
    if (!signedIn) return;
    let es: EventSource | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let stopped = false;

    const connect = () => {
      if (stopped) return;
      es = new EventSource("/api/live/bookings");
      es.addEventListener("status", (e) => {
        try {
          push(JSON.parse((e as MessageEvent).data));
          router.refresh();
        } catch {
          /* ignore a malformed frame */
        }
      });
      es.onerror = () => {
        es?.close();
        if (!stopped) retry = setTimeout(connect, 2000);
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      es?.close();
    };
  }, [signedIn, router, push]);

  return <StatusPopup data={popup} onClose={next} />;
}

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
      title: "Not this time",
      body: u.reason || `${u.clubName} couldn't fit this one in. Try another night.`,
      cta: { label: "Find another night", href: "/nights" },
    };
  if (u.status === "waitlisted")
    return {
      kind: "waitlisted",
      title: "You're on the waitlist",
      body: `${u.clubName} is full for now. We'll tell you if a spot opens.`,
    };
  return null;
}

/**
 * Mounted once in the app layout. Opens an SSE connection and shows a popup
 * the moment an admin changes one of your bookings. Signed-out visitors get
 * a 401 and this quietly does nothing.
 */
export function LiveBookings({ signedIn }: { signedIn: boolean }) {
  const [popup, setPopup] = useState<PopupPayload | null>(null);
  const router = useRouter();
  const queue = useRef<PopupPayload[]>([]);

  const next = useCallback(() => {
    const item = queue.current.shift() ?? null;
    setPopup(item);
  }, []);

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
          const p = toPopup(JSON.parse((e as MessageEvent).data));
          if (!p) return;
          queue.current.push(p);
          setPopup((cur) => cur ?? queue.current.shift() ?? null);
          router.refresh(); // keep the page's own data honest
        } catch {
          /* ignore a malformed frame */
        }
      });

      // The route closes itself before the platform's timeout; reconnect.
      es.onerror = () => {
        es?.close();
        if (!stopped) retry = setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      stopped = true;
      clearTimeout(retry);
      es?.close();
    };
  }, [signedIn, router]);

  return <StatusPopup data={popup} onClose={next} />;
}

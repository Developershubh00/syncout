"use client";
import { useEffect } from "react";
import { useNotifications } from "./NotificationsProvider";

/** Opening the notifications page marks everything read. */
export function MarkAllRead({ any }: { any: boolean }) {
  const { clear } = useNotifications();
  useEffect(() => {
    clear();
    if (!any) return;
    fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }, [any, clear]);
  return null;
}

"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { useNotifications } from "./NotificationsProvider";
import { cn } from "@/lib/utils";

/** Rings when something new arrives. */
export function NotificationBell({ className }: { className?: string }) {
  const { unread, signedIn } = useNotifications();
  const ring = useAnimationControls();
  const last = useRef(unread);

  useEffect(() => {
    if (unread > last.current) ring.start({ rotate: [0, -18, 15, -11, 8, -4, 0], transition: { duration: 0.8 } });
    last.current = unread;
  }, [unread, ring]);

  if (!signedIn) return null;
  return (
    <Link
      href="/notifications"
      aria-label={unread ? `${unread} unread notifications` : "Notifications"}
      className={cn("relative rounded-full border border-line p-2 text-muted active:bg-raised", className)}
    >
      <motion.span animate={ring} className="block origin-top">
        <Bell className="size-[18px]" />
      </motion.span>
      <AnimatePresence>
        {unread > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 400 }}
            className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-red px-1 text-[10.5px] font-bold text-white"
          >
            {unread > 9 ? "9+" : unread}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

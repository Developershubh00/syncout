"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Sparkles, CalendarDays, Disc3, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/events", label: "Events", Icon: Sparkles, party: true },
  { href: "/nights", label: "Nights", Icon: CalendarDays },
  { href: "/clubs", label: "Clubs", Icon: Disc3 },
  { href: "/passes", label: "Passes", Icon: Ticket },
  { href: "/profile", label: "You", Icon: User },
];

export function TabBar() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+10px)] z-40 rounded-[24px] border border-white/10 bg-[#121216]/90 shadow-[0_14px_40px_-12px_rgba(0,0,0,.85)] backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch px-1 py-1.5">
        {tabs.map(({ href, label, Icon, party }) => {
          const active =
            href === "/"
              ? path === "/"
              : path.startsWith(href) || (href === "/events" && path.startsWith("/dandiya")) || (href === "/passes" && path.startsWith("/tickets"));
          return (
            <li key={href} className="flex-1">
              <Link href={href} className="relative flex flex-col items-center gap-1 py-1.5" aria-current={active ? "page" : undefined}>
                {active && (
                  <motion.span
                    layoutId="tab-pill"
                    className={cn("absolute inset-x-2 top-0 -z-10 h-full rounded-2xl", party ? "bg-[#ff2bd6]/12" : "bg-white/[0.06]")}
                    transition={{ type: "spring", damping: 28, stiffness: 380 }}
                  />
                )}
                <motion.span
                  animate={{ scale: active ? 1.14 : 1, y: active ? -1 : 0 }}
                  whileTap={{ scale: 0.82 }}
                  transition={{ type: "spring", damping: 14, stiffness: 420 }}
                >
                  <Icon
                    className={cn("size-[21px] transition-colors", active ? (party ? "text-[#ff6ad5]" : "text-text") : party ? "text-[#ff6ad5]/70" : "text-faint")}
                    strokeWidth={active ? 2.3 : 1.8}
                  />
                </motion.span>
                <span className={cn("text-[10.5px] font-medium transition-colors", active ? "text-text" : "text-faint")}>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

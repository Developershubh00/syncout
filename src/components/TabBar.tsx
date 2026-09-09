"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Disc3, CalendarDays, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/clubs", label: "Clubs", Icon: Disc3 },
  { href: "/nights", label: "Nights", Icon: CalendarDays },
  { href: "/passes", label: "Passes", Icon: Ticket },
  { href: "/profile", label: "You", Icon: User },
];

export function TabBar() {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/85 backdrop-blur-xl">
      <ul className="mx-auto flex max-w-lg items-stretch pb-safe pt-1.5">
        {tabs.map(({ href, label, Icon }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="relative flex flex-col items-center gap-1 py-1.5"
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="tab-dot"
                    className="absolute -top-1.5 h-[3px] w-7 rounded-full bg-red"
                    transition={{ type: "spring", damping: 30, stiffness: 420 }}
                  />
                )}
                <Icon
                  className={cn("size-[21px] transition-colors", active ? "text-red" : "text-faint")}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span className={cn("text-[10.5px] font-medium", active ? "text-text" : "text-faint")}>
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

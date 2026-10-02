"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notify/NotificationBell";
import { InstallButton } from "@/components/pwa/InstallButton";
import { Logo } from "@/components/brand/Logo";

const links = [
  { href: "/events", label: "Events", party: true },
  { href: "/nights", label: "Nights" },
  { href: "/clubs", label: "Clubs" },
  { href: "/passes", label: "Passes" },
  { href: "/profile", label: "Your list" },
];

export function DesktopNav({ initials = "" }: { initials?: string }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-ink/85 backdrop-blur-xl lg:block">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-7 px-6">
        <Link href="/" aria-label="SyncOut home">
          <Logo size="sm" />
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, party }) => {
            const active = path.startsWith(href) || (href === "/events" && path.startsWith("/dandiya"));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative px-3 py-5 text-[14px] font-medium transition-colors",
                  active ? "text-text" : party ? "text-[#ff6ad5] hover:text-text" : "text-muted hover:text-text"
                )}
              >
                {label}
                {active && (
                  <motion.span
                    layoutId="desknav"
                    className={cn("absolute inset-x-3 bottom-0 h-[2px] rounded-full", party ? "bg-gradient-to-r from-[#ff2bd6] to-[#ff8a00]" : "bg-red")}
                    transition={{ type: "spring", damping: 30, stiffness: 420 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <form action="/search" className="ml-auto w-[300px]">
          <div className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3">
            <Search className="size-4 shrink-0 text-faint" />
            <input name="q" placeholder="Search clubs, events or areas" className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
          </div>
        </form>

        <InstallButton variant="pill" />
        <NotificationBell />

        <Link href="/profile" className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-raised text-[12px] font-semibold">
          {initials || "\u00b7\u00b7"}
        </Link>
      </div>
    </header>
  );
}

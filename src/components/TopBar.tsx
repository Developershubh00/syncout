"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Search, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { NotificationBell } from "@/components/notify/NotificationBell";
import { CITIES, cityBySlug, DEFAULT_CITY } from "@/lib/cities";
import { cn } from "@/lib/utils";

export function TopBar({ city = DEFAULT_CITY, showCity = true }: { city?: string; showCity?: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const current = cityBySlug(city) ?? CITIES[0];
  // Stay on the same list when switching city (home, clubs, nights, events).
  const base = ["/clubs", "/nights", "/events"].includes(path) ? path : "/";

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/85 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3 lg:max-w-none lg:px-0 lg:pb-0 lg:pt-0">
          <Link href="/" className="font-display text-[21px] font-extrabold tracking-tight lg:hidden">
            Sync<span className="text-red">Out</span>
          </Link>

          {showCity && (
            <button onClick={() => setOpen(true)} className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12.5px] text-muted active:bg-raised">
              {current.name}
              <ChevronDown className="size-3.5" />
            </button>
          )}

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <NotificationBell />
            <Link href="/search" aria-label="Search clubs, events and nights" className="rounded-full border border-line p-2 text-muted active:bg-raised">
              <Search className="size-[18px]" />
            </Link>
          </div>
        </div>
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} title="Where are you out tonight?">
        <ul className="space-y-1">
          {CITIES.map((c) => (
            <li key={c.slug}>
              <Link
                href={c.live ? `${base}?city=${c.slug}` : "#"}
                onClick={(e) => {
                  if (!c.live) e.preventDefault();
                  else setOpen(false);
                }}
                className={cn("flex items-center justify-between rounded-2xl px-4 py-3.5", c.live ? "active:bg-raised" : "opacity-45")}
              >
                <span className="text-[15px]">{c.name}</span>
                {c.slug === current.slug ? (
                  <Check className="size-4 text-red" />
                ) : !c.live ? (
                  <span className="text-[11px] text-faint">Coming soon</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </Sheet>
    </>
  );
}

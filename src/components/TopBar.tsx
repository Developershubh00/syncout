"use client";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/utils";

const CITY_LIST = [
  { name: "New Delhi", slug: "new-delhi", live: true },
  { name: "Gurugram", slug: "gurugram", live: true },
  { name: "Noida", slug: "noida", live: true },
  { name: "Mumbai", slug: "mumbai", live: false },
  { name: "Jaipur", slug: "jaipur", live: false },
  { name: "Lucknow", slug: "lucknow", live: false },
  { name: "Kasol", slug: "kasol", live: false },
  { name: "Dubai", slug: "dubai", live: false },
];

export function TopBar({ city = "new-delhi" }: { city?: string }) {
  const [open, setOpen] = useState(false);
  const current = CITY_LIST.find((c) => c.slug === city) ?? CITY_LIST[0];

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line-soft bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <Link href="/" className="font-display text-[21px] font-extrabold tracking-tight">
            Sync<span className="text-red">Out</span>
          </Link>

          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[12.5px] text-muted active:bg-raised"
          >
            {current.name}
            <ChevronDown className="size-3.5" />
          </button>

          <Link
            href="/search"
            aria-label="Search clubs and nights"
            className="ml-auto rounded-full border border-line p-2 text-muted active:bg-raised"
          >
            <Search className="size-[18px]" />
          </Link>
        </div>
      </header>

      <Sheet open={open} onClose={() => setOpen(false)} title="Where are you out tonight?">
        <ul className="space-y-1">
          {CITY_LIST.map((c) => (
            <li key={c.slug}>
              <Link
                href={c.live ? `/?city=${c.slug}` : "#"}
                onClick={(e) => {
                  if (!c.live) e.preventDefault();
                  else setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-3.5",
                  c.live ? "active:bg-raised" : "opacity-45"
                )}
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

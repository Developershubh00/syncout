"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();

  return (
    <nav className="px-3">
      {items.map((n) => {
        const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "mb-0.5 block rounded-lg px-3 py-2 text-[13.5px] transition-colors",
              active ? "bg-raised font-semibold text-text" : "text-muted hover:text-text"
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

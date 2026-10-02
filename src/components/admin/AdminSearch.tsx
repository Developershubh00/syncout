"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";

/** Keeps the other filters in the URL and swaps q. */
export function AdminSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  return (
    <form
      className="mt-4 flex h-11 max-w-[520px] items-center gap-2 rounded-xl border border-line bg-raised px-3"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        const p = new URLSearchParams(sp.toString());
        if (q) p.set("q", q);
        else p.delete("q");
        router.push(`${path}?${p.toString()}`);
      }}
    >
      <Search className="size-4 text-faint" />
      <input name="q" defaultValue={sp.get("q") ?? ""} placeholder={placeholder} className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-faint" />
    </form>
  );
}

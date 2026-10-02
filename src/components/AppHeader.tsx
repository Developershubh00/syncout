"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, MapPin, User, Sparkles, Disc3, CalendarDays, PartyPopper, Music2, ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/notify/NotificationBell";
import { LIVE_CITIES, cityName } from "@/lib/cities";

const CATS = [
  { href: "/dandiya", label: "Dandiya", Icon: Sparkles },
  { href: "/events?category=garba", label: "Garba", Icon: Music2 },
  { href: "/events?category=party", label: "Parties", Icon: PartyPopper },
  { href: "/nights", label: "Guestlists", Icon: CalendarDays },
  { href: "/clubs", label: "Clubs", Icon: Disc3 },
];

/** The phone home header: logo, you, a greeting, search and the city — like an app's first screen. */
export function AppHeader({ city, name, initials }: { city: string; name?: string | null; initials?: string }) {
  const router = useRouter();
  const first = name?.split(" ")[0];
  const [mini, setMini] = useState(false);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setMini(window.scrollY > 260));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  return (
    <>
    <AnimatePresence>
      {mini && (
        <motion.div
          className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-ink/85 px-4 pb-2.5 pt-[calc(env(safe-area-inset-top,0px)+8px)] backdrop-blur-xl lg:hidden"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%", transition: { duration: 0.22, ease: "easeIn" } }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          <div className="flex items-center gap-3">
            <Link href="/" aria-label="SyncOut home"><Logo size="xs" hello={false} /></Link>
            <Link href="/search" aria-label="Search" className="ml-auto grid size-9 place-items-center rounded-full bg-white/[0.07]"><Search className="size-[17px]" /></Link>
            <Link href="/profile" aria-label="Your profile" className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#ff2bd6] to-[#e4113c] text-[12.5px] font-bold text-white">
              {initials || <User className="size-4" />}
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    <header className="app-header-in relative overflow-hidden rounded-b-[30px] border-b border-white/[0.06] bg-gradient-to-b from-[#1c0b1f] via-[#140b17] to-ink px-4 pb-5 pt-[calc(env(safe-area-inset-top,0px)+12px)] lg:hidden">
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-[#ff2bd6]/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-24 top-16 size-56 rounded-full bg-[#f2c14e]/10 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <Link href="/" aria-label="SyncOut home">
          <Logo size="sm" />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Link href="/profile" aria-label="Your profile" className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#ff2bd6] to-[#e4113c] text-[14px] font-bold text-white ring-2 ring-white/10">
            {initials || <User className="size-[18px]" />}
          </Link>
        </div>
      </div>

      <p className="relative mt-5 text-[13.5px] text-muted">Hello {first || "there"}</p>
      <h1 className="relative mt-0.5 font-display text-[29px] font-extrabold leading-[1.08] tracking-tight">
        Discover tonight in <span className="text-shimmer">{cityName(city, true)}</span>
      </h1>

      <div className="relative mt-4 flex gap-2">
        <Link href="/search" className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-[14px] text-muted backdrop-blur">
          <Search className="size-[18px] shrink-0" />
          <span className="truncate">Search clubs, events or areas</span>
        </Link>
        <label className="relative flex h-12 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.06] pl-3 pr-2.5 text-[13px] font-semibold">
          <MapPin className="size-4 text-gold" />
          <span className="max-w-[72px] truncate">{cityName(city, true)}</span>
          <ChevronDown className="size-3.5 text-muted" />
          <select
            aria-label="City"
            value={city}
            onChange={(e) => {
              document.cookie = `so_city=${encodeURIComponent(e.target.value)}; path=/; max-age=31536000; samesite=lax`;
              router.push(`/?city=${e.target.value}`);
            }}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {LIVE_CITIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Categories" className="rail chips relative -mx-4 mt-4 px-4">
        {CATS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[12.5px] font-semibold">
            <Icon className="size-3.5 text-[#ff6ad5]" /> {label}
          </Link>
        ))}
      </nav>
    </header>
    </>
  );
}

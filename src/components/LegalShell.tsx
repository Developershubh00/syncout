import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export function LegalShell({ title, updated, intro, children }: { title: string; updated: string; intro?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-[760px] px-4 pb-16 pt-5 lg:px-0">
      <Link href="/" className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-text">
        <ChevronLeft className="size-4" /> Home
      </Link>
      <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-raised px-2.5 py-1 text-[11.5px] font-semibold text-muted">
        <ShieldCheck className="size-3.5 text-gold" /> Last updated {updated}
      </p>
      <h1 className="mt-3 font-display text-[32px] font-extrabold leading-tight tracking-tight lg:text-[40px]">{title}</h1>
      {intro && <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{intro}</p>}
      <div className="legal mt-8 space-y-7 text-[14px] leading-relaxed text-white/80">{children}</div>
      <nav className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-[13px] text-muted">
        <Link href="/privacy" className="hover:text-text">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-text">Terms of Use</Link>
        <Link href="/refunds" className="hover:text-text">Refunds &amp; Cancellation</Link>
        <Link href="/contact" className="hover:text-text">Contact</Link>
      </nav>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] text-text">{title}</h2>
      <div className="mt-2 space-y-2.5">{children}</div>
    </section>
  );
}

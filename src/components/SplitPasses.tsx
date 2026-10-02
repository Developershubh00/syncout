import { Users, MessageCircle, ExternalLink, Check } from "lucide-react";
import { absUrl } from "@/lib/site";
import { guestPath } from "@/lib/access";

/** Each friend gets their own QR — they can arrive separately, and each pass works once. */
export function SplitPasses({ code, admits, admitted, title, when }: { code: string; admits: number; admitted: number[]; title: string; when: string }) {
  if (admits < 2) return null;
  return (
    <section className="rounded-[20px] border border-line bg-surface p-4">
      <h2 className="flex items-center gap-2 text-[16px]"><Users className="size-4 text-gold" /> Send each friend their own pass</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-muted">Everyone gets a personal QR, so you don&apos;t have to arrive together. Each pass lets one person in, once.</p>
      <ul className="mt-3 space-y-2">
        {Array.from({ length: admits }, (_, i) => i + 1).map((n) => {
          const url = absUrl(guestPath(code, n));
          const msg = `Your pass for ${title} (${when}) — show this QR at the gate: ${url}`;
          const inAlready = admitted.includes(n);
          return (
            <li key={n} className="flex items-center gap-2.5 rounded-xl bg-raised px-3 py-2.5">
              <span className={`grid size-8 shrink-0 place-items-center rounded-lg text-[12.5px] font-bold ${inAlready ? "bg-gold text-ink" : "bg-surface"}`}>
                {inAlready ? <Check className="size-4" /> : n}
              </span>
              <span className="min-w-0 flex-1 text-[13px]">{n === 1 ? "You" : `Friend ${n - 1}`}{inAlready ? " · in" : ""}</span>
              <a href={url} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-muted" aria-label={`Open pass ${n}`}><ExternalLink className="size-3.5" /></a>
              {n > 1 && (
                <a href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2.5 py-1 text-[12px] font-semibold text-[#25D366]">
                  <MessageCircle className="size-3.5" /> Send
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { ScanLine, Hourglass } from "lucide-react";

/** Server-rendered QR (inline SVG) — works offline once the page has been opened. */
export function TicketQr({ svg, caption, barcode, pending }: { svg: string; caption: string; barcode?: string; pending?: boolean }) {
  return (
    <div className={`mt-4 flex items-center gap-4 rounded-2xl border p-3.5 ${pending ? "border-line bg-raised/60" : "border-gold/30 bg-gold/[0.05]"}`}>
      <div className={`w-[118px] shrink-0 rounded-xl bg-white p-2 [&>svg]:h-auto [&>svg]:w-full ${pending ? "opacity-55" : ""}`} dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="min-w-0">
        {pending ? (
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-muted"><Hourglass className="size-4" /> Activates once confirmed</p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] font-semibold text-gold"><ScanLine className="size-4" /> Scan at the entry</p>
        )}
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{caption}</p>
        {barcode && <div className="mt-2.5 rounded-lg bg-white p-1.5 [&>svg]:h-[46px] [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: barcode }} />}
      </div>
    </div>
  );
}

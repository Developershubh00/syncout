"use client";
import { Printer, MessageCircle, ScanLine, Download } from "lucide-react";

export function TicketCardActions({ wa, door, svg, code }: { wa: string; door: string; svg: string; code: string }) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `syncout-${code}-qr.svg` });
    a.click();
    URL.revokeObjectURL(url);
  };
  const btn = "inline-flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold";
  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <button onClick={() => window.print()} className={`${btn} bg-raised`}><Printer className="size-4" /> Print</button>
      <a href={wa} target="_blank" rel="noreferrer" className={`${btn} bg-[#25D366]/15 text-[#25D366]`}><MessageCircle className="size-4" /> Send to guest</a>
      <button onClick={download} className={`${btn} bg-raised`}><Download className="size-4" /> QR image</button>
      <a href={door} className={`${btn} bg-gold/15 text-gold`}><ScanLine className="size-4" /> Open at door</a>
    </div>
  );
}

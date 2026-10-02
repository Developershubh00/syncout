import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/session";
import { ticketInfo } from "@/lib/ticket-info";
import { qrSvg } from "@/lib/upi";
import { code128Svg } from "@/lib/barcode";
import { absUrl } from "@/lib/site";
import { passPath, ticketPath } from "@/lib/access";
import { guestWaLink } from "@/lib/whatsapp";
import { TicketCardActions } from "@/components/admin/TicketCardActions";

export const dynamic = "force-dynamic";

/** Printable entry card for venue managers: QR + barcode + every detail of the booking. */
export default async function TicketCard({ params }: { params: Promise<{ code: string }> }) {
  if (!(await getAdmin())) redirect("/admin");
  const t = await ticketInfo((await params).code);
  if (!t) notFound();
  const door = absUrl(`/door?code=${t.code}`);
  const qr = await qrSvg(door);
  const bar = code128Svg(t.code, { height: 64, module: 2 });
  const link = absUrl(t.kind === "ticket" ? ticketPath(t.code) : passPath(t.code));
  const wa = guestWaLink(t.phone, `Hi ${t.name.split(" ")[0]}, your SyncOut ${t.kind === "ticket" ? "ticket" : "pass"} for ${t.title}: ${link} — show the QR at the entry.`);

  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="font-display text-[24px] font-extrabold tracking-tight print:hidden lg:text-[30px]">Entry card</h1>
      <p className="mb-4 mt-1 text-[12.5px] text-muted print:hidden">Scan the QR with a phone, or the barcode with a scanner gun, at <b>/door</b> — it shows everything below and checks people in.</p>
      <TicketCardActions wa={wa} door={`/door?code=${t.code}`} svg={qr} code={t.code} />

      <article className="print-card mt-5 max-w-[560px] overflow-hidden rounded-[22px] border border-line bg-surface">
        <header className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold">{t.kind === "ticket" ? "Event ticket" : "Guestlist pass"}</p>
            <h2 className="mt-1 text-[20px] leading-tight">{t.title}</h2>
            <p className="mt-0.5 text-[13px] text-muted">{t.venue}</p>
          </div>
          <span className={`shrink-0 rounded-md px-2 py-1 text-[11.5px] font-bold uppercase ${t.ok ? "bg-gold/15 text-gold" : "bg-red/12 text-red-hot"}`}>{t.status.replace(/_/g, " ")}</span>
        </header>
        <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
          <div className="w-[170px] shrink-0 rounded-xl bg-white p-2.5 [&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: qr }} />
          <div className="w-full min-w-0">
            <p className="font-display text-[30px] font-extrabold tracking-[0.14em]">{t.code}</p>
            <div className="mt-2 rounded-lg bg-white p-2 [&>svg]:h-[64px] [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: bar }} />
            <p className="mt-2 text-[12px] text-muted">{t.admits} {t.admits === 1 ? "person" : "people"} · {t.admitted.length} checked in</p>
          </div>
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 border-t border-line p-5 text-[13px]">
          {t.rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-faint">{k}</dt>
              <dd className="min-w-0 break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </article>
      <div className="h-10" />
    </div>
  );
}

import { redirect } from "next/navigation";
import { desc, gt, isNull, or, sql } from "drizzle-orm";
import { ShieldAlert, Globe, Clock } from "lucide-react";
import { getAdmin } from "@/lib/session";
import { db } from "@/db";
import { ipBlocks, securityEvents } from "@/db/schema";
import { rowsOf } from "@/lib/api";
import { BlockForm, Unblock } from "@/components/admin/SecurityTools";

export const dynamic = "force-dynamic";
const ist = (d: Date | string) => new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
const KIND: Record<string, string> = { attack: "bg-red/15 text-red-hot", scan: "bg-gold/15 text-gold", bot: "bg-[#ff2bd6]/15 text-[#ff6ad5]", blocked: "bg-white/10 text-white/70" };

export default async function AdminSecurity() {
  if (!(await getAdmin())) redirect("/admin");
  const [events, blocks, totals] = await Promise.all([
    db.select().from(securityEvents).orderBy(desc(securityEvents.createdAt)).limit(200).catch(() => []),
    db.select().from(ipBlocks).where(or(isNull(ipBlocks.expiresAt), gt(ipBlocks.expiresAt, new Date()))).orderBy(desc(ipBlocks.createdAt)).catch(() => []),
    db.execute(sql`select
        count(*) filter (where kind = 'attack' and created_at > now() - interval '24 hours')::int as attacks,
        count(*) filter (where kind = 'scan' and created_at > now() - interval '24 hours')::int as scans,
        count(distinct ip) filter (where created_at > now() - interval '24 hours')::int as ips
      from security_events`).then((r) => rowsOf<{ attacks: number; scans: number; ips: number }>(r)[0]).catch(() => ({ attacks: 0, scans: 0, ips: 0 })),
  ]);

  return (
    <div className="px-4 pt-6 lg:px-0">
      <h1 className="flex items-center gap-2 font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]"><ShieldAlert className="size-6 text-red-hot" /> Security</h1>
      <p className="mt-1 text-[12.5px] text-muted">Attacks and scans the firewall caught. Repeat offenders are blocked automatically; you can also block or unblock by hand.</p>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        {[["Attacks / 24h", totals?.attacks ?? 0], ["Scans / 24h", totals?.scans ?? 0], ["Unique IPs / 24h", totals?.ips ?? 0]].map(([l, v]) => (
          <div key={String(l)} className="rounded-[18px] border border-line bg-surface p-4">
            <p className="font-display text-[24px] font-extrabold">{Number(v)}</p>
            <p className="mt-0.5 text-[12px] text-muted">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-5"><BlockForm /></div>

      {blocks.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[16px]">Blocked IPs ({blocks.length})</h2>
          <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
            {blocks.map((b) => (
              <li key={b.ip} className="flex items-center gap-3 rounded-[16px] border border-red/25 bg-red/[0.05] p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13.5px] font-semibold">{b.ip}</p>
                  <p className="truncate text-[11.5px] text-muted">{b.reason} · by {b.by} · {b.expiresAt ? `until ${ist(b.expiresAt)}` : "permanent"}</p>
                </div>
                <Unblock ip={b.ip} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-[16px]">Recent events</h2>
        <div className="mt-3 overflow-x-auto rounded-[18px] border border-line">
          <table className="w-full min-w-[640px] text-[12.5px]">
            <thead className="bg-raised text-left text-[11px] text-faint">
              <tr><th className="p-2.5">When</th><th className="p-2.5">Kind</th><th className="p-2.5">IP</th><th className="p-2.5">Reason</th><th className="p-2.5">Path</th></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap p-2.5 text-muted"><span className="flex items-center gap-1"><Clock className="size-3" /> {ist(e.createdAt)}</span></td>
                  <td className="p-2.5"><span className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase ${KIND[e.kind] ?? "bg-raised"}`}>{e.kind}</span></td>
                  <td className="whitespace-nowrap p-2.5 font-mono">{e.ip}{e.country ? <span className="ml-1 text-faint"><Globe className="inline size-3" /> {e.country}</span> : null}</td>
                  <td className="p-2.5 text-muted">{e.reason}</td>
                  <td className="max-w-[260px] break-all p-2.5 text-faint">{e.path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length === 0 && <p className="mt-6 text-center text-[13px] text-muted">Nothing caught yet — all quiet.</p>}
      </section>
      <div className="h-10" />
    </div>
  );
}

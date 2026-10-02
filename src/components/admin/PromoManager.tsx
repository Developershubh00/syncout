"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Link2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import { toIstInput, fromIstInput } from "@/lib/ist-input";
import { rs } from "@/lib/event-format";
import { cn } from "@/lib/utils";

export type AdminPromo = {
  id: string; code: string; label: string | null; kind: string; value: number; maxDiscount: number | null; eventId: string | null;
  minQuantity: number; maxUses: number | null; usedCount: number; startsAt: string | null; endsAt: string | null; isActive: boolean;
  orders: number; revenue: number; discount: number;
};
type Ev = { id: string; title: string; slug: string };
const BLANK = { code: "", label: "", kind: "percent", value: "10", maxDiscount: "", eventId: "", minQuantity: "1", maxUses: "", startsAt: "", endsAt: "", isActive: true };

export function PromoManager({ promos, events, origin }: { promos: AdminPromo[]; events: Ev[]; origin: string }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPromo | null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const evById = new Map(events.map((e) => [e.id, e]));
  const linkFor = (p: { code: string; eventId: string | null }) => {
    const ev = p.eventId ? evById.get(p.eventId) : null;
    return `${origin}${ev ? `/events/${ev.slug}` : "/events"}?promo=${p.code}`;
  };

  function edit(p: AdminPromo | null) {
    setEditing(p);
    setF(
      p
        ? {
            code: p.code, label: p.label ?? "", kind: p.kind, value: String(p.value), maxDiscount: p.maxDiscount ? String(p.maxDiscount) : "",
            eventId: p.eventId ?? "", minQuantity: String(p.minQuantity), maxUses: p.maxUses ? String(p.maxUses) : "",
            startsAt: toIstInput(p.startsAt), endsAt: toIstInput(p.endsAt), isActive: p.isActive,
          }
        : { ...BLANK }
    );
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const n = (v: string) => (v.trim() === "" ? null : Math.round(Number(v)));
      const body = {
        code: f.code.trim(), label: f.label.trim() || null, kind: f.kind, value: n(f.value) ?? 0, maxDiscount: n(f.maxDiscount),
        eventId: f.eventId || null, minQuantity: n(f.minQuantity) ?? 1, maxUses: n(f.maxUses),
        startsAt: fromIstInput(f.startsAt), endsAt: fromIstInput(f.endsAt), isActive: f.isActive,
      };
      const res = await fetch(editing ? `/api/admin/promos/${editing.id}` : "/api/admin/promos", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Saved");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button onClick={() => edit(null)}><Plus className="size-4" /> New code</Button>
      <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
        {promos.map((p) => {
          const expired = p.endsAt && new Date(p.endsAt).getTime() < Date.now();
          const full = p.maxUses != null && p.usedCount >= p.maxUses;
          return (
            <li key={p.id} className={cn("rounded-[18px] border bg-surface p-4", p.isActive && !expired && !full ? "border-line" : "border-line opacity-70")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[18px] font-extrabold tracking-wide">{p.code}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-muted">
                    {p.kind === "percent" ? `${p.value}% off${p.maxDiscount ? ` (max ${rs(p.maxDiscount)})` : ""}` : `${rs(p.value)} off`} · {p.eventId ? evById.get(p.eventId)?.title ?? "one event" : "all events"}
                    {p.label ? ` · ${p.label}` : ""}
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", !p.isActive ? "bg-raised text-muted" : expired ? "bg-red/12 text-red-hot" : full ? "bg-red/12 text-red-hot" : "bg-gold/15 text-gold")}>
                  {!p.isActive ? "off" : expired ? "expired" : full ? "used up" : "live"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-raised py-2"><p className="text-[15px] font-bold">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""}</p><p className="text-[10.5px] text-faint">uses</p></div>
                <div className="rounded-xl bg-raised py-2"><p className="text-[15px] font-bold">{rs(p.revenue)}</p><p className="text-[10.5px] text-faint">paid sales</p></div>
                <div className="rounded-xl bg-raised py-2"><p className="text-[15px] font-bold">{rs(p.discount)}</p><p className="text-[10.5px] text-faint">given away</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(linkFor(p)).then(() => toast("Link copied — the code applies itself at checkout"))}><Link2 className="size-3.5" /> Copy link</Button>
                <Button size="sm" variant="ghost" onClick={() => edit(p)}><Pencil className="size-3.5" /> Edit</Button>
                <Button size="sm" variant="danger" onClick={async () => { if (!confirm(`Delete ${p.code}?`)) return; await fetch(`/api/admin/promos/${p.id}`, { method: "DELETE" }); router.refresh(); }}><Trash2 className="size-3.5" /></Button>
              </div>
            </li>
          );
        })}
      </ul>
      {promos.length === 0 && <p className="mt-6 text-center text-[13px] text-muted">No codes yet. Make one per influencer or ad so you can see what each one sells.</p>}

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.code}` : "New promo code"}>
        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code" placeholder="RIYA10" value={f.code} onChange={(e) => setF((s) => ({ ...s, code: e.target.value.toUpperCase() }))} />
            <Input label="For (who / which ad)" placeholder="Riya — Instagram" value={f.label} onChange={set("label")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Type" value={f.kind} onChange={set("kind")}><option value="percent">% off</option><option value="flat">₹ off</option></Select>
            <Input label={f.kind === "percent" ? "Percent" : "Rupees"} inputMode="numeric" value={f.value} onChange={set("value")} />
            <Input label="Max ₹ off" hint="% codes" inputMode="numeric" value={f.maxDiscount} onChange={set("maxDiscount")} />
          </div>
          <Select label="Event" value={f.eventId} onChange={set("eventId")}>
            <option value="">All events</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Min tickets" inputMode="numeric" value={f.minQuantity} onChange={set("minQuantity")} />
            <Input label="Max uses" hint="blank = unlimited" inputMode="numeric" value={f.maxUses} onChange={set("maxUses")} />
            <Input label="Starts (IST)" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} />
            <Input label="Ends (IST)" type="datetime-local" value={f.endsAt} onChange={set("endsAt")} />
          </div>
          <Toggle label="Live" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          <Button size="lg" full loading={busy} onClick={save}>Save code</Button>
        </div>
      </Sheet>
    </div>
  );
}

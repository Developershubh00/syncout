"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import { toIstInput, fromIstInput } from "@/lib/ist-input";

export type AdminOffer = {
  id: string; title: string; subtitle: string | null; description: string | null; image: string | null;
  clubId: string | null; validTill: string | null; isActive: boolean; sortOrder: number;
};

const BLANK = { title: "", subtitle: "", description: "", clubId: "", validTill: "", isActive: true, sortOrder: "0" };

export function OfferManager({ initial, clubs }: { initial: AdminOffer[]; clubs: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOffer | null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function edit(o: AdminOffer | null) {
    setEditing(o);
    setF(o ? { title: o.title, subtitle: o.subtitle ?? "", description: o.description ?? "", clubId: o.clubId ?? "", validTill: toIstInput(o.validTill), isActive: o.isActive, sortOrder: String(o.sortOrder) } : { ...BLANK });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        title: f.title.trim(), subtitle: f.subtitle || null, description: f.description || null, image: editing?.image ?? null,
        clubId: f.clubId || null, validTill: fromIstInput(f.validTill), isActive: f.isActive, sortOrder: Number(f.sortOrder) || 0,
      };
      const res = await fetch(editing ? `/api/admin/offers/${editing.id}` : "/api/admin/offers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
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

  async function remove(o: AdminOffer) {
    if (!confirm(`Delete "${o.title}"?`)) return;
    await fetch(`/api/admin/offers/${o.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="px-4 pt-6 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Offers</h1>
          <p className="mt-0.5 text-[12.5px] text-muted">The &ldquo;On the house&rdquo; cards on the home page.</p>
        </div>
        <Button size="sm" onClick={() => edit(null)}><Plus className="size-4" /> Add</Button>
      </div>
      <ul className="mt-4 space-y-2.5">
        {initial.map((o) => (
          <li key={o.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{o.title}</p>
              <p className="mt-0.5 truncate text-[12px] text-muted">{o.subtitle} · {o.isActive ? "on" : "off"}{o.validTill ? ` · until ${new Date(o.validTill).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}</p>
            </div>
            <button onClick={() => edit(o)} aria-label="Edit" className="rounded-lg p-2 text-muted active:bg-raised"><Pencil className="size-4" /></button>
            <button onClick={() => remove(o)} aria-label="Delete" className="rounded-lg p-2 text-red-hot active:bg-raised"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit offer" : "New offer"}>
        <div className="space-y-3.5">
          <Input label="Title" value={f.title} onChange={set("title")} />
          <Input label="Small heading" value={f.subtitle} onChange={set("subtitle")} placeholder="Tonight only" />
          <Textarea label="Description" value={f.description} onChange={set("description")} />
          <Select label="Club (optional)" value={f.clubId} onChange={set("clubId")}>
            <option value="">All clubs</option>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ends (IST)" hint="optional" type="datetime-local" value={f.validTill} onChange={set("validTill")} />
            <Input label="Order" inputMode="numeric" value={f.sortOrder} onChange={set("sortOrder")} />
          </div>
          <Toggle label="On" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          <Button size="lg" full loading={busy} onClick={save}>Save</Button>
        </div>
      </Sheet>
    </div>
  );
}

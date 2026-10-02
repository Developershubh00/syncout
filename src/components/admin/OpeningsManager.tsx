"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import { JOB_TYPE_LABEL } from "@/data/careers";
import { slugify } from "@/lib/utils";

export type AdminOpening = {
  id: string; slug: string; title: string; team: string | null; type: string; location: string; workMode: string; summary: string | null;
  responsibilities: string[]; requirements: string[]; perks: string[]; isActive: boolean; sortOrder: number;
};
const BLANK = { slug: "", title: "", team: "", type: "full_time", location: "Delhi NCR", workMode: "hybrid", summary: "", responsibilities: "", requirements: "", perks: "", isActive: true, sortOrder: "0" };
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

export function OpeningsManager({ initial }: { initial: AdminOpening[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOpening | null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));

  function edit(o: AdminOpening | null) {
    setEditing(o);
    setF(o ? { slug: o.slug, title: o.title, team: o.team ?? "", type: o.type, location: o.location, workMode: o.workMode, summary: o.summary ?? "", responsibilities: o.responsibilities.join("\n"), requirements: o.requirements.join("\n"), perks: o.perks.join("\n"), isActive: o.isActive, sortOrder: String(o.sortOrder) } : { ...BLANK });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        slug: f.slug.trim() || slugify(f.title), title: f.title.trim(), team: f.team || null, type: f.type, location: f.location, workMode: f.workMode,
        summary: f.summary || null, responsibilities: lines(f.responsibilities), requirements: lines(f.requirements), perks: lines(f.perks),
        isActive: f.isActive, sortOrder: Number(f.sortOrder) || 0,
      };
      const res = await fetch(editing ? `/api/admin/openings/${editing.id}` : "/api/admin/openings", { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
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

  async function loadDefaults() {
    const res = await fetch("/api/admin/openings/defaults", { method: "POST" });
    const data = await res.json();
    toast(data.message ?? data.error);
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => edit(null)}><Plus className="size-4" /> Add role</Button>
        {initial.length === 0 && <Button size="sm" variant="gold" onClick={loadDefaults}><Download className="size-4" /> Load default roles</Button>}
      </div>
      <ul className="mt-3 grid gap-2.5 lg:grid-cols-2">
        {initial.map((o) => (
          <li key={o.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{o.title}</p>
              <p className="mt-0.5 text-[12px] text-muted">{JOB_TYPE_LABEL[o.type] ?? o.type} · {o.location} · {o.isActive ? "live" : "hidden"}</p>
            </div>
            <button onClick={() => edit(o)} aria-label="Edit" className="rounded-lg p-2 text-muted"><Pencil className="size-4" /></button>
            <button onClick={async () => { if (!confirm(`Delete ${o.title}?`)) return; await fetch(`/api/admin/openings/${o.id}`, { method: "DELETE" }); router.refresh(); }} aria-label="Delete" className="rounded-lg p-2 text-red-hot"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit role" : "New role"}>
        <div className="space-y-3.5">
          <Input label="Title" value={f.title} onChange={set("title")} placeholder="Event Planner" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Type" value={f.type} onChange={set("type")}>
              {Object.entries(JOB_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
            <Select label="Work mode" value={f.workMode} onChange={set("workMode")}>
              <option value="onsite">On-site</option><option value="hybrid">Hybrid</option><option value="remote">Remote</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Team" value={f.team} onChange={set("team")} />
            <Input label="Location" value={f.location} onChange={set("location")} />
          </div>
          <Textarea label="Summary" value={f.summary} onChange={set("summary")} />
          <Textarea label="What you'll do (one per line)" value={f.responsibilities} onChange={set("responsibilities")} />
          <Textarea label="What we're looking for (one per line)" value={f.requirements} onChange={set("requirements")} />
          <Textarea label="Perks (one per line)" value={f.perks} onChange={set("perks")} />
          <Input label="Slug" hint="URL — auto if blank" value={f.slug} onChange={set("slug")} />
          <Toggle label="Live" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          <Button size="lg" full loading={busy} onClick={save}>Save</Button>
        </div>
      </Sheet>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import { LIVE_CITIES } from "@/lib/cities";
import { toIstInput, fromIstInput } from "@/lib/ist-input";

export type AdminAnnouncement = {
  id: string; title: string; body: string | null; image: string | null; ctaLabel: string | null; ctaUrl: string | null;
  kind: "popup" | "banner"; audience: "everyone" | "signed_in" | "signed_out"; theme: "festive" | "elegant";
  cities: string[]; startsAt: string | null; endsAt: string | null; isActive: boolean; priority: number;
};

const BLANK = {
  title: "", body: "", image: "", ctaLabel: "", ctaUrl: "", kind: "popup" as const, audience: "everyone" as const,
  theme: "festive" as const, cities: [] as string[], startsAt: "", endsAt: "", isActive: true, priority: "0",
};

export function AnnouncementManager({ initial }: { initial: AdminAnnouncement[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [f, setF] = useState<{ [K in keyof typeof BLANK]: (typeof BLANK)[K] | string } & { cities: string[]; isActive: boolean }>({ ...BLANK });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function edit(a: AdminAnnouncement | null) {
    setEditing(a);
    setF(
      a
        ? {
            title: a.title, body: a.body ?? "", image: a.image ?? "", ctaLabel: a.ctaLabel ?? "", ctaUrl: a.ctaUrl ?? "",
            kind: a.kind, audience: a.audience, theme: a.theme, cities: a.cities, startsAt: toIstInput(a.startsAt),
            endsAt: toIstInput(a.endsAt), isActive: a.isActive, priority: String(a.priority),
          }
        : { ...BLANK }
    );
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        title: String(f.title).trim(), body: f.body || null, image: f.image || null, ctaLabel: f.ctaLabel || null,
        ctaUrl: f.ctaUrl || null, kind: f.kind, audience: f.audience, theme: f.theme, cities: f.cities,
        startsAt: fromIstInput(String(f.startsAt)), endsAt: fromIstInput(String(f.endsAt)), isActive: f.isActive,
        priority: Number(f.priority) || 0,
      };
      const res = await fetch(editing ? `/api/admin/announcements/${editing.id}` : "/api/admin/announcements", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast("Saved — live within seconds");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function remove(a: AdminAnnouncement) {
    if (!confirm(`Delete "${a.title}"?`)) return;
    await fetch(`/api/admin/announcements/${a.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="px-4 pt-6 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Popups &amp; banners</h1>
          <p className="mt-0.5 max-w-[60ch] text-[12.5px] text-muted">
            A popup shows once per visitor, after a moment on browse pages. A banner sits at the top of every page until dismissed.
          </p>
        </div>
        <Button size="sm" onClick={() => edit(null)}><Plus className="size-4" /> Add</Button>
      </div>

      <ul className="mt-4 space-y-2.5">
        {initial.map((a) => (
          <li key={a.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{a.title}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {a.kind} · {a.audience.replace("_", " ")} · {a.isActive ? "on" : "off"}
                {a.endsAt ? ` · until ${new Date(a.endsAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}` : ""}
              </p>
            </div>
            <button onClick={() => edit(a)} aria-label="Edit" className="rounded-lg p-2 text-muted active:bg-raised"><Pencil className="size-4" /></button>
            <button onClick={() => remove(a)} aria-label="Delete" className="rounded-lg p-2 text-red-hot active:bg-raised"><Trash2 className="size-4" /></button>
          </li>
        ))}
        {initial.length === 0 && <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">No announcements yet.</li>}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit announcement" : "New announcement"}>
        <div className="space-y-3.5">
          <ImagePicker label="Image (optional)" folder="announcements" value={String(f.image)} onChange={(url) => setF((s) => ({ ...s, image: url }))} />
          <Input label="Title" value={String(f.title)} onChange={set("title")} />
          <Textarea label="Message" value={String(f.body)} onChange={set("body")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Button text" value={String(f.ctaLabel)} onChange={set("ctaLabel")} placeholder="See Dandiya nights" />
            <Input label="Button link" value={String(f.ctaUrl)} onChange={set("ctaUrl")} placeholder="/dandiya" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Select label="Type" value={String(f.kind)} onChange={set("kind")}>
              <option value="popup">Popup</option>
              <option value="banner">Banner</option>
            </Select>
            <Select label="Who sees it" value={String(f.audience)} onChange={set("audience")}>
              <option value="everyone">Everyone</option>
              <option value="signed_in">Signed in</option>
              <option value="signed_out">Signed out</option>
            </Select>
            <Select label="Look" value={String(f.theme)} onChange={set("theme")}>
              <option value="festive">Festive</option>
              <option value="elegant">Elegant</option>
            </Select>
          </div>
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-muted">City buttons in the popup</p>
            <div className="flex flex-wrap gap-2">
              {LIVE_CITIES.map((c) => {
                const on = f.cities.includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    onClick={() => setF((s) => ({ ...s, cities: on ? s.cities.filter((x) => x !== c.slug) : [...s.cities, c.slug] }))}
                    className={"rounded-full border px-3 py-1.5 text-[13px] " + (on ? "border-red bg-red/12" : "border-line text-muted")}
                  >
                    {c.short}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Show from (IST)" hint="optional" type="datetime-local" value={String(f.startsAt)} onChange={set("startsAt")} />
            <Input label="Until (IST)" hint="optional" type="datetime-local" value={String(f.endsAt)} onChange={set("endsAt")} />
          </div>
          <Input label="Priority" hint="higher shows first" inputMode="numeric" value={String(f.priority)} onChange={set("priority")} />
          <Toggle label="On" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          <Button size="lg" full loading={busy} onClick={save}>Save</Button>
        </div>
      </Sheet>
    </div>
  );
}

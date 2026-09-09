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
import { friendlyDate, fmtTime, slugify } from "@/lib/utils";

type ClubOpt = { id: string; name: string; coverImage: string | null };
type Row = {
  id: string; title: string; slug: string; poster: string | null; startsAt: string;
  guestlistOpen: boolean; isActive: boolean; clubId: string; clubName: string;
  femaleLimit: number; coupleLimit: number; maleLimit: number;
  femaleEnabled: boolean; coupleEnabled: boolean; maleEnabled: boolean;
};

/** datetime-local value for "today at 9 PM" */
function defaultStart() {
  const d = new Date();
  d.setHours(21, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T21:00`;
}

const BLANK = {
  clubId: "", title: "", slug: "", description: "", poster: "", artist: "",
  musicType: "", startsAt: defaultStart(), cutoffHour: "18",
  femaleEnabled: true, femaleLimit: "40", femalePrice: "0",
  coupleEnabled: true, coupleLimit: "30", couplePrice: "0",
  maleEnabled: true, maleLimit: "15", malePrice: "0",
  perks: "Free entry on the guestlist, Complimentary food, House drinks covered",
  guestlistOpen: true, isFeatured: false, isActive: true,
};

export function NightManager({ clubs, initial }: { clubs: ClubOpt[]; initial: Row[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [f, setF] = useState({ ...BLANK, clubId: clubs[0]?.id ?? "" });
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function startNew() {
    setEditing(null);
    setF({ ...BLANK, clubId: clubs[0]?.id ?? "" });
    setOpen(true);
  }

  function startEdit(r: Row) {
    setEditing(r);
    const d = new Date(r.startsAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    setF({
      ...BLANK,
      clubId: r.clubId, title: r.title, slug: r.slug, poster: r.poster ?? "",
      startsAt: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
      femaleEnabled: r.femaleEnabled, coupleEnabled: r.coupleEnabled, maleEnabled: r.maleEnabled,
      femaleLimit: String(r.femaleLimit), coupleLimit: String(r.coupleLimit), maleLimit: String(r.maleLimit),
      guestlistOpen: r.guestlistOpen, isActive: r.isActive,
    });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const club = clubs.find((c) => c.id === f.clubId);
      const payload = {
        clubId: f.clubId,
        title: f.title,
        slug: f.slug || slugify(`${club?.name ?? ""}-${f.title}-${f.startsAt.slice(0, 10)}`),
        description: f.description || null,
        poster: f.poster || club?.coverImage || null,
        artist: f.artist || null,
        musicType: f.musicType || null,
        startsAt: new Date(f.startsAt).toISOString(),
        cutoffHour: Number(f.cutoffHour),
        femaleEnabled: f.femaleEnabled, femaleLimit: Number(f.femaleLimit), femalePrice: Number(f.femalePrice),
        coupleEnabled: f.coupleEnabled, coupleLimit: Number(f.coupleLimit), couplePrice: Number(f.couplePrice),
        maleEnabled: f.maleEnabled, maleLimit: Number(f.maleLimit), malePrice: Number(f.malePrice),
        perks: f.perks.split(",").map((s) => s.trim()).filter(Boolean),
        guestlistOpen: f.guestlistOpen, isFeatured: f.isFeatured, isActive: f.isActive,
      };
      const res = await fetch(editing ? `/api/admin/events/${editing.id}` : "/api/admin/events", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(editing ? "Night updated" : "Night added");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.title}" at ${r.clubName}? Its bookings go too.`)) return;
    await fetch(`/api/admin/events/${r.id}`, { method: "DELETE" });
    toast("Night deleted");
    router.refresh();
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight">Nights</h1>
        <Button size="sm" onClick={startNew}><Plus className="size-4" /> Add</Button>
      </div>

      <ul className="mt-4 space-y-2.5">
        {initial.map((r) => (
          <li key={r.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{r.title}</p>
              <p className="truncate text-[12.5px] text-muted">{r.clubName}</p>
              <p className="mt-0.5 text-[11.5px] text-faint">
                {friendlyDate(r.startsAt)} {fmtTime(r.startsAt)} · {r.guestlistOpen ? "List open" : "List closed"}
                {!r.isActive && " · Hidden"}
              </p>
            </div>
            <button onClick={() => startEdit(r)} aria-label="Edit" className="rounded-lg p-2 text-muted active:bg-raised">
              <Pencil className="size-4" />
            </button>
            <button onClick={() => remove(r)} aria-label="Delete" className="rounded-lg p-2 text-red-hot active:bg-raised">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit night" : "New night"}>
        <div className="space-y-3.5">
          <ImagePicker label="Poster" folder="nights" value={f.poster} onChange={(url) => setF((s) => ({ ...s, poster: url }))} />
          <Select label="Club" value={f.clubId} onChange={set("clubId")}>
            {clubs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Title" placeholder="Saturday Mainroom" value={f.title} onChange={set("title")} />
          <Input label="Starts" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Artist" value={f.artist} onChange={set("artist")} />
            <Input label="Music" value={f.musicType} onChange={set("musicType")} />
          </div>
          <Textarea label="Description" value={f.description} onChange={set("description")} />
          <Input label="Perks" hint="Comma separated" value={f.perks} onChange={set("perks")} />
          <Input label="Cutoff hour" hint="24h IST — 18 is 6 PM" inputMode="numeric" value={f.cutoffHour} onChange={set("cutoffHour")} />

          <div className="rounded-2xl border border-line bg-raised p-3.5">
            <p className="mb-3 text-[13px] font-semibold">Lists</p>
            <ListRow label="Girls" on={f.femaleEnabled} limit={f.femaleLimit} price={f.femalePrice}
              onToggle={(v) => setF((s) => ({ ...s, femaleEnabled: v }))}
              onLimit={(v) => setF((s) => ({ ...s, femaleLimit: v }))}
              onPrice={(v) => setF((s) => ({ ...s, femalePrice: v }))} />
            <ListRow label="Couples" on={f.coupleEnabled} limit={f.coupleLimit} price={f.couplePrice}
              onToggle={(v) => setF((s) => ({ ...s, coupleEnabled: v }))}
              onLimit={(v) => setF((s) => ({ ...s, coupleLimit: v }))}
              onPrice={(v) => setF((s) => ({ ...s, couplePrice: v }))} />
            <ListRow label="Guys" on={f.maleEnabled} limit={f.maleLimit} price={f.malePrice}
              onToggle={(v) => setF((s) => ({ ...s, maleEnabled: v }))}
              onLimit={(v) => setF((s) => ({ ...s, maleLimit: v }))}
              onPrice={(v) => setF((s) => ({ ...s, malePrice: v }))} />
          </div>

          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Taking applications" on={f.guestlistOpen} onChange={(v) => setF((s) => ({ ...s, guestlistOpen: v }))} />
            <Toggle label="Featured" on={f.isFeatured} onChange={(v) => setF((s) => ({ ...s, isFeatured: v }))} />
            <Toggle label="Live" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          </div>

          <Button size="lg" full loading={busy} onClick={save}>
            {editing ? "Save changes" : "Add night"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function ListRow({
  label, on, limit, price, onToggle, onLimit, onPrice,
}: {
  label: string; on: boolean; limit: string; price: string;
  onToggle: (v: boolean) => void; onLimit: (v: string) => void; onPrice: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 border-t border-line py-2.5 first:border-0 first:pt-0">
      <div className="w-20 shrink-0">
        <Toggle label={label} on={on} onChange={onToggle} />
      </div>
      <input
        value={limit}
        onChange={(e) => onLimit(e.target.value)}
        inputMode="numeric"
        aria-label={`${label} capacity`}
        className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px]"
        placeholder="Cap"
      />
      <input
        value={price}
        onChange={(e) => onPrice(e.target.value)}
        inputMode="numeric"
        aria-label={`${label} price`}
        className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-[13px]"
        placeholder="₹"
      />
    </div>
  );
}

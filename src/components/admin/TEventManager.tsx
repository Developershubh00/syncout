"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, ExternalLink } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import { CITIES } from "@/lib/cities";
import { CATEGORIES, MODE_LABEL } from "@/lib/event-labels";
import { datesLabel, timeLabel, rs } from "@/lib/event-format";
import { toIstInput, fromIstInput, istTonightInput } from "@/lib/ist-input";
import { slugify } from "@/lib/utils";

type Tier = { id?: string | null; name: string; description: string; price: string; admits: string; capacity: string; perOrderMax: string; isActive: boolean; compareAtPrice: string; badge: string; salesStartAt: string; salesEndAt: string };
export type AdminEvent = {
  id: string; slug: string; title: string; category: string; citySlug: string; venueName: string; area: string | null;
  address: string | null; mapUrl: string | null; startsAt: string; endsAt: string | null; days: string[]; timeLabel: string | null;
  poster: string | null; description: string | null; highlights: string[]; organizer: string | null; ageLimit: string | null;
  dressCode: string | null; terms: string | null; bookingMode: "upi" | "whatsapp" | "external" | "free"; externalUrl: string | null;
  sourceUrl: string | null; salesOpen: boolean; isFeatured: boolean; isActive: boolean; sortOrder: number;
  tiers: { id: string; name: string; description: string | null; price: number; admits: number; capacity: number | null; perOrderMax: number; isActive: boolean; compareAtPrice?: number | null; badge?: string | null; salesStartAt?: string | Date | null; salesEndAt?: string | Date | null }[];
  stats: { orders: number; confirmed: number; toVerify: number };
};

const blankTier = (): Tier => ({ name: "Entry pass", description: "", price: "499", admits: "1", capacity: "", perOrderMax: "10", isActive: true, compareAtPrice: "", badge: "", salesStartAt: "", salesEndAt: "" });

const BLANK = {
  title: "", slug: "", category: "dandiya", citySlug: "new-delhi", venueName: "", area: "", address: "", mapUrl: "",
  startsAt: istTonightInput(19), endsAt: "", days: [] as string[], timeLabel: "", poster: "", description: "",
  highlights: "", organizer: "", ageLimit: "", dressCode: "", terms: "", bookingMode: "upi" as AdminEvent["bookingMode"],
  externalUrl: "", sourceUrl: "", salesOpen: true, isFeatured: false, isActive: true, sortOrder: "0",
};

export function TEventManager({ initial }: { initial: AdminEvent[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [tiers, setTiers] = useState<Tier[]>([blankTier()]);
  const [dayInput, setDayInput] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  function startNew() {
    setEditing(null);
    setF({ ...BLANK, startsAt: istTonightInput(19) });
    setTiers([blankTier()]);
    setOpen(true);
  }

  function startEdit(e: AdminEvent) {
    setEditing(e);
    setF({
      title: e.title, slug: e.slug, category: e.category, citySlug: e.citySlug, venueName: e.venueName, area: e.area ?? "",
      address: e.address ?? "", mapUrl: e.mapUrl ?? "", startsAt: toIstInput(e.startsAt), endsAt: toIstInput(e.endsAt),
      days: e.days, timeLabel: e.timeLabel ?? "", poster: e.poster ?? "", description: e.description ?? "",
      highlights: e.highlights.join(", "), organizer: e.organizer ?? "", ageLimit: e.ageLimit ?? "", dressCode: e.dressCode ?? "",
      terms: e.terms ?? "", bookingMode: e.bookingMode, externalUrl: e.externalUrl ?? "", sourceUrl: e.sourceUrl ?? "",
      salesOpen: e.salesOpen, isFeatured: e.isFeatured, isActive: e.isActive, sortOrder: String(e.sortOrder),
    });
    setTiers(
      e.tiers.map((t) => ({
        id: t.id, name: t.name, description: t.description ?? "", price: String(t.price), admits: String(t.admits),
        capacity: t.capacity == null ? "" : String(t.capacity), perOrderMax: String(t.perOrderMax), isActive: t.isActive,
        compareAtPrice: t.compareAtPrice == null ? "" : String(t.compareAtPrice), badge: t.badge ?? "",
        salesStartAt: t.salesStartAt ? toIstInput(t.salesStartAt) : "", salesEndAt: t.salesEndAt ? toIstInput(t.salesEndAt) : "",
      }))
    );
    setOpen(true);
  }

  const setTier = (i: number, patch: Partial<Tier>) => setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));

  async function save() {
    setBusy(true);
    try {
      const startsAt = fromIstInput(f.startsAt);
      if (!startsAt) throw new Error("Pick a start date and time");
      const payload = {
        title: f.title.trim(),
        slug: f.slug.trim() || slugify(`${f.title}-${f.citySlug}-${f.startsAt.slice(0, 4)}`),
        category: f.category,
        citySlug: f.citySlug,
        venueName: f.venueName.trim(),
        area: f.area || null,
        address: f.address || null,
        mapUrl: f.mapUrl || null,
        startsAt,
        endsAt: fromIstInput(f.endsAt),
        days: f.days,
        timeLabel: f.timeLabel || null,
        poster: f.poster || null,
        gallery: [],
        description: f.description || null,
        highlights: f.highlights.split(",").map((s) => s.trim()).filter(Boolean),
        organizer: f.organizer || null,
        ageLimit: f.ageLimit || null,
        dressCode: f.dressCode || null,
        terms: f.terms || null,
        bookingMode: f.bookingMode,
        externalUrl: f.externalUrl || null,
        sourceUrl: f.sourceUrl || null,
        salesOpen: f.salesOpen,
        isFeatured: f.isFeatured,
        isActive: f.isActive,
        sortOrder: Number(f.sortOrder) || 0,
        tiers: tiers.map((t) => ({
          id: t.id || null,
          name: t.name.trim(),
          description: t.description || null,
          price: Math.max(0, Math.round(Number(t.price) || 0)),
          admits: Math.max(1, Math.round(Number(t.admits) || 1)),
          capacity: t.capacity === "" ? null : Math.max(0, Math.round(Number(t.capacity))),
          perOrderMax: Math.max(1, Math.round(Number(t.perOrderMax) || 10)),
          isActive: t.isActive,
          compareAtPrice: t.compareAtPrice === "" ? null : Math.max(0, Math.round(Number(t.compareAtPrice) || 0)) || null,
          badge: t.badge.trim() || null,
          salesStartAt: fromIstInput(t.salesStartAt),
          salesEndAt: fromIstInput(t.salesEndAt),
        })),
      };
      const res = await fetch(editing ? `/api/admin/tevents/${editing.id}` : "/api/admin/tevents", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(editing ? "Event updated" : "Event added");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function remove(e: AdminEvent) {
    if (!confirm(`Delete "${e.title}"?`)) return;
    const res = await fetch(`/api/admin/tevents/${e.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return toast(data.error ?? "Couldn't delete", "err");
    toast("Event deleted");
    router.refresh();
  }

  return (
    <div className="px-4 pt-6 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight lg:text-[30px]">Events</h1>
          <p className="mt-0.5 text-[12.5px] text-muted">Dandiya, concerts, festivals — anything with tickets. Shows on /events.</p>
        </div>
        <Button size="sm" onClick={startNew}><Plus className="size-4" /> Add</Button>
      </div>

      <ul className="mt-4 grid gap-2.5 lg:grid-cols-2">
        {initial.map((e) => (
          <li key={e.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-raised">
              {e.poster && <Image src={e.poster} alt="" fill sizes="64px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{e.title}</p>
              <p className="truncate text-[12px] text-muted">{e.venueName} · {datesLabel(e)} · {timeLabel(e)}</p>
              <p className="mt-0.5 text-[11.5px] text-faint">
                {e.isActive ? "Live" : "Hidden"} · {MODE_LABEL[e.bookingMode]}{e.salesOpen ? "" : " · sales closed"} ·{" "}
                {e.tiers.length ? `from ${rs(Math.min(...e.tiers.map((t) => t.price)))}` : "no tickets"} · {e.stats.confirmed}/{e.stats.orders} confirmed
                {e.stats.toVerify ? <b className="text-gold"> · {e.stats.toVerify} to verify</b> : null}
              </p>
            </div>
            <a href={`/events/${e.slug}`} target="_blank" rel="noreferrer" aria-label="View" className="rounded-lg p-2 text-muted"><ExternalLink className="size-4" /></a>
            <button onClick={() => startEdit(e)} aria-label="Edit" className="rounded-lg p-2 text-muted active:bg-raised"><Pencil className="size-4" /></button>
            <button onClick={() => remove(e)} aria-label="Delete" className="rounded-lg p-2 text-red-hot active:bg-raised"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit event" : "New event"}>
        <div className="space-y-3.5">
          <ImagePicker label="Poster (landscape works best)" folder="events" value={f.poster} onChange={(url) => setF((s) => ({ ...s, poster: url }))} />
          <Input label="Title" value={f.title} onChange={set("title")} placeholder="Dandiya Night 2026" />
          <Input label="Slug" hint="URL — auto if blank" value={f.slug} onChange={set("slug")} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={f.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
            <Select label="City" value={f.citySlug} onChange={set("citySlug")}>
              {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </Select>
          </div>
          <Input label="Venue" value={f.venueName} onChange={set("venueName")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Area" value={f.area} onChange={set("area")} />
            <Input label="Maps link" value={f.mapUrl} onChange={set("mapUrl")} />
          </div>
          <Input label="Address" value={f.address} onChange={set("address")} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Starts (IST)" type="datetime-local" value={f.startsAt} onChange={set("startsAt")} />
            <Input label="Ends (IST)" hint="optional" type="datetime-local" value={f.endsAt} onChange={set("endsAt")} />
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-medium text-muted">Runs on these dates <span className="text-faint">(add each day for multi-day events)</span></p>
            <div className="flex gap-2">
              <input type="date" value={dayInput} onChange={(e) => setDayInput(e.target.value)} className="h-11 flex-1 rounded-xl border border-line bg-raised px-3 text-[14px]" />
              <Button
                variant="ghost"
                onClick={() => {
                  if (dayInput && !f.days.includes(dayInput)) setF((s) => ({ ...s, days: [...s.days, dayInput].sort() }));
                  setDayInput("");
                }}
              >
                Add date
              </Button>
            </div>
            {f.days.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.days.map((d) => (
                  <span key={d} className="inline-flex items-center gap-1 rounded-lg bg-raised px-2 py-1 text-[12px]">
                    {d}
                    <button onClick={() => setF((s) => ({ ...s, days: s.days.filter((x) => x !== d) }))} aria-label={`Remove ${d}`}><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Input label="Time label" hint='optional, e.g. "Multiple slots"' value={f.timeLabel} onChange={set("timeLabel")} />
          <Textarea label="Description" value={f.description} onChange={set("description")} />
          <Input label="Highlights" hint="comma separated" value={f.highlights} onChange={set("highlights")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Age" value={f.ageLimit} onChange={set("ageLimit")} placeholder="21+" />
            <Input label="Dress code" value={f.dressCode} onChange={set("dressCode")} />
            <Input label="Organiser" value={f.organizer} onChange={set("organizer")} />
          </div>
          <Textarea label="Terms & entry rules" value={f.terms} onChange={set("terms")} />

          <div className="rounded-2xl border border-line bg-raised p-3.5">
            <Select label="How people book" value={f.bookingMode} onChange={set("bookingMode")}>
              <option value="upi">UPI QR + WhatsApp proof (you confirm)</option>
              <option value="whatsapp">Send booking on WhatsApp (you share payment there)</option>
              <option value="external">Link to the organiser&apos;s ticket page</option>
              <option value="free">Free RSVP (you confirm)</option>
            </Select>
            {f.bookingMode === "external" && <div className="mt-3"><Input label="Ticket link" value={f.externalUrl} onChange={set("externalUrl")} /></div>}

            <p className="mb-2 mt-4 text-[13px] font-semibold">Ticket types</p>
            <div className="space-y-2.5">
              {tiers.map((t, i) => (
                <div key={t.id ?? `new-${i}`} className="rounded-xl border border-line bg-surface p-3">
                  <div className="flex gap-2">
                    <input value={t.name} onChange={(e) => setTier(i, { name: e.target.value })} placeholder="Name" className="h-10 flex-1 rounded-lg border border-line bg-raised px-3 text-[13px]" />
                    <button onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))} aria-label="Remove ticket type" className="rounded-lg px-2 text-red-hot"><Trash2 className="size-4" /></button>
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <Small label="₹ price" value={t.price} onChange={(v) => setTier(i, { price: v })} />
                    <Small label="Admits" value={t.admits} onChange={(v) => setTier(i, { admits: v })} />
                    <Small label="Per day cap" value={t.capacity} onChange={(v) => setTier(i, { capacity: v })} placeholder="∞" />
                    <Small label="Max/order" value={t.perOrderMax} onChange={(v) => setTier(i, { perOrderMax: v })} />
                  </div>
                  <input value={t.description} onChange={(e) => setTier(i, { description: e.target.value })} placeholder="Short note (optional)" className="mt-2 h-9 w-full rounded-lg border border-line bg-raised px-3 text-[12.5px]" />
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Small label="Was ₹ (crossed out)" value={t.compareAtPrice} onChange={(v) => setTier(i, { compareAtPrice: v })} placeholder="—" />
                    <label className="block">
                      <span className="text-[10.5px] text-faint">Badge</span>
                      <input value={t.badge} onChange={(e) => setTier(i, { badge: e.target.value })} placeholder="Early bird" className="h-9 w-full rounded-lg border border-line bg-raised px-2.5 text-[12.5px]" />
                    </label>
                    <label className="block">
                      <span className="text-[10.5px] text-faint">Sale starts (IST)</span>
                      <input type="datetime-local" value={t.salesStartAt} onChange={(e) => setTier(i, { salesStartAt: e.target.value })} className="h-9 w-full rounded-lg border border-line bg-raised px-2 text-[12px]" />
                    </label>
                    <label className="block">
                      <span className="text-[10.5px] text-faint">Sale ends (IST) — countdown</span>
                      <input type="datetime-local" value={t.salesEndAt} onChange={(e) => setTier(i, { salesEndAt: e.target.value })} className="h-9 w-full rounded-lg border border-line bg-raised px-2 text-[12px]" />
                    </label>
                  </div>
                  <div className="mt-2"><Toggle label="On sale" on={t.isActive} onChange={(v) => setTier(i, { isActive: v })} /></div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2.5" onClick={() => setTiers((ts) => [...ts, blankTier()])}><Plus className="size-3.5" /> Add ticket type</Button>
          </div>

          <Input label="Source link" hint="admin only — where the listing came from" value={f.sourceUrl} onChange={set("sourceUrl")} />
          <div className="flex flex-wrap gap-5 pt-1">
            <Toggle label="Taking bookings" on={f.salesOpen} onChange={(v) => setF((s) => ({ ...s, salesOpen: v }))} />
            <Toggle label="Featured" on={f.isFeatured} onChange={(v) => setF((s) => ({ ...s, isFeatured: v }))} />
            <Toggle label="Live" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          </div>
          <Button size="lg" full loading={busy} onClick={save}>{editing ? "Save changes" : "Add event"}</Button>
        </div>
      </Sheet>
    </div>
  );
}

function Small({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] text-faint">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder={placeholder} className="h-9 w-full rounded-lg border border-line bg-raised px-2.5 text-[13px]" />
    </label>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { GalleryPicker } from "@/components/admin/GalleryPicker";
import { useToast } from "@/components/ui/Toast";
import { slugify } from "@/lib/utils";
import type { Club } from "@/db/schema";

const BLANK = {
  name: "", slug: "", citySlug: "new-delhi", area: "", address: "", tagline: "",
  description: "", coverImage: "", musicTypes: "", tags: "", priceForTwo: "",
  openTime: "8:00 PM", closeTime: "1:00 AM",
  dressCode: "Smart casuals. No shorts, no slippers.", phone: "", mapUrl: "", gallery: [] as string[], instagram: "", instagramPosts: "",
  isFeatured: false, isActive: true,
};

export function ClubManager({ initial }: { initial: Club[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Club | null>(null);
  const [f, setF] = useState({ ...BLANK });
  const [busy, setBusy] = useState(false);

  function startNew() {
    setEditing(null);
    setF({ ...BLANK });
    setOpen(true);
  }

  function startEdit(c: Club) {
    setEditing(c);
    setF({
      name: c.name, slug: c.slug, citySlug: c.citySlug, area: c.area,
      address: c.address ?? "", tagline: c.tagline ?? "", description: c.description ?? "",
      coverImage: c.coverImage ?? "", musicTypes: c.musicTypes.join(", "), tags: c.tags.join(", "),
      priceForTwo: c.priceForTwo ? String(c.priceForTwo) : "",
      openTime: c.openTime ?? "", closeTime: c.closeTime ?? "",
      dressCode: c.dressCode ?? "", phone: c.phone ?? "", mapUrl: c.mapUrl ?? "",
      gallery: c.gallery?.length ? c.gallery : c.coverImage ? [c.coverImage] : [], instagram: c.instagram ?? "", instagramPosts: (c.instagramPosts ?? []).join("\n"),
      isFeatured: c.isFeatured, isActive: c.isActive,
    });
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    try {
      const payload = {
        ...f,
        slug: f.slug || slugify(f.name),
        priceForTwo: f.priceForTwo ? Number(f.priceForTwo) : null,
        musicTypes: f.musicTypes.split(",").map((s) => s.trim()).filter(Boolean),
        tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
        // the first photo is the cover
        coverImage: f.gallery[0] ?? (f.coverImage || null),
        gallery: f.gallery.length ? f.gallery : f.coverImage ? [f.coverImage] : [],
        instagram: f.instagram.trim() || null,
        instagramPosts: f.instagramPosts.split(/\s+/).map((x) => x.trim()).filter(Boolean),
      };
      const res = await fetch(editing ? `/api/admin/clubs/${editing.id}` : "/api/admin/clubs", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast(editing ? "Club updated" : "Club added");
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  async function remove(c: Club) {
    if (!confirm(`Delete ${c.name}? Its nights and bookings go too.`)) return;
    await fetch(`/api/admin/clubs/${c.id}`, { method: "DELETE" });
    toast("Club deleted");
    router.refresh();
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="px-4 pt-6 lg:px-0 lg:pt-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight">Clubs</h1>
        <Button size="sm" onClick={startNew}><Plus className="size-4" /> Add</Button>
      </div>

      <ul className="mt-4 space-y-2.5">
        {initial.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-raised">
              {c.coverImage && <Image src={c.coverImage} alt="" fill sizes="60px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold">{c.name}</p>
              <p className="truncate text-[12.5px] text-muted">{c.area} · {c.citySlug}</p>
              <p className="mt-0.5 text-[11.5px] text-faint">
                {c.isActive ? "Live" : "Hidden"}{c.isFeatured ? " · Featured" : ""}
              </p>
            </div>
            <button onClick={() => startEdit(c)} aria-label="Edit" className="rounded-lg p-2 text-muted active:bg-raised">
              <Pencil className="size-4" />
            </button>
            <button onClick={() => remove(c)} aria-label="Delete" className="rounded-lg p-2 text-red-hot active:bg-raised">
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={open} onClose={() => setOpen(false)} title={editing ? "Edit club" : "New club"}>
        <div className="space-y-3.5">
          <ImagePicker
            value={f.coverImage}
            folder="venues"
            onChange={(url) => setF((s) => ({ ...s, coverImage: url }))}
          />
          <Input label="Name" value={f.name} onChange={set("name")} />
          <Input label="Slug" hint="Auto from name if blank" value={f.slug} onChange={set("slug")} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="City" value={f.citySlug} onChange={set("citySlug")}>
              <option value="new-delhi">New Delhi</option>
              <option value="gurugram">Gurugram</option>
              <option value="noida">Noida</option>
              <option value="mumbai">Mumbai</option>
            </Select>
            <Input label="Area" value={f.area} onChange={set("area")} />
          </div>
          <Input label="Address" value={f.address} onChange={set("address")} />
          <Input label="Tagline" value={f.tagline} onChange={set("tagline")} />
          <Textarea label="Description" value={f.description} onChange={set("description")} />
          <Input label="Music" hint="Comma separated" value={f.musicTypes} onChange={set("musicTypes")} />
          <Input label="Tags" hint="Comma separated" value={f.tags} onChange={set("tags")} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="₹ for two" inputMode="numeric" value={f.priceForTwo} onChange={set("priceForTwo")} />
            <Input label="Opens" value={f.openTime} onChange={set("openTime")} />
            <Input label="Closes" value={f.closeTime} onChange={set("closeTime")} />
          </div>
          <Input label="Dress code" value={f.dressCode} onChange={set("dressCode")} />
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-full space-y-3 rounded-2xl border border-line p-3">
              <GalleryPicker value={f.gallery} onChange={(g) => setF((x) => ({ ...x, gallery: g, coverImage: g[0] ?? x.coverImage }))} />
              <Input label="Instagram handle" placeholder="@clubname" value={f.instagram} onChange={set("instagram")} />
              <label className="block">
                <span className="text-[12.5px] font-medium text-muted">Instagram posts to show (one link per line)</span>
                <textarea
                  value={f.instagramPosts}
                  onChange={(e) => setF((x) => ({ ...x, instagramPosts: e.target.value }))}
                  rows={3}
                  placeholder={"https://www.instagram.com/p/…\nhttps://www.instagram.com/reel/…"}
                  className="mt-1.5 w-full rounded-2xl border border-line bg-raised px-4 py-3 text-[13px]"
                />
                <span className="mt-1 block text-[11.5px] text-faint">On a post in the Instagram app: ••• → Copy link. They show on the club page through Instagram&apos;s official embed.</span>
              </label>
            </div>
            <Input label="Phone" value={f.phone} onChange={set("phone")} />
            <Input label="Maps link" value={f.mapUrl} onChange={set("mapUrl")} />
          </div>

          <div className="flex gap-5 pt-1">
            <Toggle label="Featured" on={f.isFeatured} onChange={(v) => setF((s) => ({ ...s, isFeatured: v }))} />
            <Toggle label="Live" on={f.isActive} onChange={(v) => setF((s) => ({ ...s, isActive: v }))} />
          </div>

          <Button size="lg" full loading={busy} onClick={save}>
            {editing ? "Save changes" : "Add club"}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

export function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2.5 text-[13.5px]">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={"relative h-6 w-11 rounded-full transition-colors " + (on ? "bg-red" : "bg-line")}
      >
        <span
          className={"absolute top-0.5 size-5 rounded-full bg-white transition-transform " + (on ? "translate-x-[22px]" : "translate-x-0.5")}
        />
      </button>
      {label}
    </label>
  );
}

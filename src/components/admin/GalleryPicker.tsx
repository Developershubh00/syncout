"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Star, ChevronLeft, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

/** Several photos at once: upload, reorder, pick the cover (first), remove. */
export function GalleryPicker({ value, onChange, folder = "venues" }: { value: string[]; onChange: (urls: string[]) => void; folder?: string }) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].slice(0, 12);
    setBusy(list.length);
    const urls: string[] = [];
    for (const f of list) {
      try {
        const body = new FormData();
        body.append("file", f);
        body.append("folder", folder);
        const res = await fetch("/api/upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        urls.push(data.url);
      } catch (e) {
        toast(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`, "err");
      } finally {
        setBusy((b) => b - 1);
      }
    }
    if (urls.length) onChange([...value, ...urls]);
    if (input.current) input.current.value = "";
  }

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] font-medium text-muted">Photos — the first one is the cover</span>
        <span className="text-[11.5px] text-faint">{value.length}/24</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {value.map((url, i) => (
          <div key={url + i} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-raised">
            <Image src={url} alt="" fill sizes="120px" className="object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-gold px-1.5 py-0.5 text-[9.5px] font-extrabold uppercase text-[#140c03]"><Star className="size-2.5" /> Cover</span>}
            <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move left" className="grid size-7 place-items-center rounded-full bg-ink/80 disabled:opacity-30"><ChevronLeft className="size-3.5" /></button>
              {i !== 0 && <button type="button" onClick={() => onChange([url, ...value.filter((_, k) => k !== i)])} aria-label="Make cover" className="grid size-7 place-items-center rounded-full bg-ink/80 text-gold"><Star className="size-3.5" /></button>}
              <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove" className="grid size-7 place-items-center rounded-full bg-ink/80 text-red-hot"><Trash2 className="size-3.5" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label="Move right" className="grid size-7 place-items-center rounded-full bg-ink/80 disabled:opacity-30"><ChevronRight className="size-3.5" /></button>
            </div>
          </div>
        ))}
        {value.length < 24 && (
          <button type="button" onClick={() => input.current?.click()} disabled={busy > 0} className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed border-line text-muted hover:border-white/30">
            {busy > 0 ? (
              <span className="flex flex-col items-center gap-1 text-[11.5px]"><Loader2 className="size-5 animate-spin" /> {busy} left</span>
            ) : (
              <span className="flex flex-col items-center gap-1 text-[11.5px]"><ImagePlus className="size-5" /> Add photos</span>
            )}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => add(e.target.files)} />
    </div>
  );
}

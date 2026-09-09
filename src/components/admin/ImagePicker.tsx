"use client";
import { useState } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export function ImagePicker({
  value, onChange, folder = "uploads", label = "Cover photo",
}: {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.url);
      toast("Photo uploaded");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed", "err");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-muted">{label}</p>
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-line bg-raised">
        {value && <Image src={value} alt="" fill sizes="512px" className="object-cover" />}
        {!value && !busy && (
          <div className="absolute inset-0 grid place-items-center text-[12.5px] text-faint">
            No photo yet
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-ink/60">
            <Loader2 className="size-6 animate-spin text-muted" />
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        <label className="flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-raised text-[13px] font-semibold">
          <Upload className="size-4" />
          {value ? "Replace" : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={pick} />
        </label>
        {value && (
          <button
            onClick={() => onChange("")}
            className="grid h-10 w-11 place-items-center rounded-xl bg-raised text-red-hot"
            aria-label="Remove photo"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="mt-2 h-10 w-full rounded-xl border border-line bg-raised px-3 text-[12.5px] text-muted placeholder:text-faint"
      />
    </div>
  );
}

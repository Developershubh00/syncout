"use client";
import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { soundEnabled, setSoundEnabled, playConfirm } from "@/lib/sound";

/** Let people turn the confirmation chime on or off. On by default. */
export function SoundToggle() {
  const [on, setOn] = useState(true);
  useEffect(() => setOn(soundEnabled()), []);
  return (
    <button
      onClick={() => {
        const next = !on;
        setOn(next);
        setSoundEnabled(next);
        if (next) playConfirm();
      }}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 text-left"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-raised text-gold">{on ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold">Confirmation sound</span>
        <span className="block text-[12px] text-muted">{on ? "On — the SyncOut chime plays when you book" : "Off"}</span>
      </span>
      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${on ? "bg-gold" : "bg-line"}`}>
        <span className={`block size-5 rounded-full bg-white transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

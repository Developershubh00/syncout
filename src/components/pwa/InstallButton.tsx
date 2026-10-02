"use client";
import { useState } from "react";
import { Download, Share, PlusSquare, ChevronRight } from "lucide-react";
import { usePwa } from "./PwaProvider";
import { Sheet } from "@/components/ui/Sheet";

/** "Install app" as a menu row (profile) or a small pill (desktop nav). Hidden once installed. */
export function InstallButton({ variant = "row" }: { variant?: "row" | "pill" }) {
  const { canInstall, installed, ios, install } = usePwa();
  const [help, setHelp] = useState(false);
  if (installed || !(canInstall || ios)) return null;

  const onClick = () => (canInstall ? install() : setHelp(true));

  return (
    <>
      {variant === "pill" ? (
        <button onClick={onClick} className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted hover:text-text lg:flex">
          <Download className="size-3.5" /> Install app
        </button>
      ) : (
        <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-raised">
          <span className="text-muted"><Download className="size-[18px]" /></span>
          <span className="flex-1 text-[14.5px]">Install the SyncOut app</span>
          <ChevronRight className="size-4 text-faint" />
        </button>
      )}
      <Sheet open={help} onClose={() => setHelp(false)} title="Add SyncOut to your home screen">
        <ol className="space-y-3 text-[14px] leading-relaxed">
          <li className="flex items-center gap-2">1. Open this site in <b>Safari</b>.</li>
          <li className="flex items-center gap-2">2. Tap <Share className="size-4 text-[#0a84ff]" /> <b>Share</b> at the bottom.</li>
          <li className="flex items-center gap-2">3. Choose <PlusSquare className="size-4" /> <b>Add to Home Screen</b>.</li>
        </ol>
        <p className="mt-4 text-[12.5px] text-muted">On iPhone, approval alerts only arrive once SyncOut is on your home screen.</p>
      </Sheet>
    </>
  );
}

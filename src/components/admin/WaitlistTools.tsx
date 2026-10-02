"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, MessageCircle, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function NotifyWaitlist({ eventId, waiting }: { eventId: string; waiting: number }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState<{ name: string; phone: string; detail: string; link: string }[] | null>(null);

  async function go() {
    if (!confirm(`Notify all ${waiting} people waiting?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/waitlist/notify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId, message: msg || undefined }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast(`${data.notified} notified · ${data.inApp} in the app — finish the rest on WhatsApp`);
      setList(data.whatsapp);
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[18px] border border-gold/30 bg-gold/[0.05] p-4">
      <p className="text-[13.5px] font-semibold">Spots opened up?</p>
      <p className="mt-0.5 text-[12.5px] text-muted">Notifies everyone waiting: in the app, by push and email, plus a WhatsApp list below for one-tap messages.</p>
      <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Optional message — e.g. 40 more passes for Saturday just released" className="mt-3 h-10 w-full rounded-xl border border-line bg-raised px-3 text-[13px]" />
      <Button className="mt-3" variant="gold" loading={busy} disabled={!waiting} onClick={go}><BellRing className="size-4" /> Notify {waiting} waiting</Button>
      {list && list.length > 0 && (
        <ul className="mt-4 space-y-2">
          {list.map((w) => (
            <li key={w.phone} className="flex items-center gap-3 rounded-xl bg-raised px-3 py-2 text-[13px]">
              <span className="min-w-0 flex-1 truncate"><b>{w.name}</b> · {w.detail}</span>
              <a href={w.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2.5 py-1 text-[12px] text-[#25D366]"><MessageCircle className="size-3.5" /> Send</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WaitRowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  async function set(s: string) {
    await fetch(`/api/admin/waitlist/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: s }) });
    router.refresh();
  }
  return (
    <div className="flex gap-1.5">
      {status !== "booked" && <button onClick={() => set("booked")} className="inline-flex items-center gap-1 rounded-lg bg-raised px-2 py-1 text-[11.5px]"><Check className="size-3" /> Booked</button>}
      {status !== "removed" && <button onClick={() => set("removed")} aria-label="Remove" className="rounded-lg bg-raised px-2 py-1 text-red-hot"><Trash2 className="size-3" /></button>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, KeyRound, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";

type Row = { id: string; name: string; phone: string; isActive: boolean; lastLoginAt: string | null };

export function StaffManager({ rows, doorUrl }: { rows: Row[]; doorUrl: string }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ name: "", phone: "", pin: "" });
  const [busy, setBusy] = useState(false);

  async function call(url: string, method: string, body?: unknown, ok?: string) {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error ?? "Failed", "err");
      return false;
    }
    if (ok) toast(ok);
    router.refresh();
    return true;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-line bg-surface p-4">
        <p className="text-[14px] font-semibold">Add door staff</p>
        <p className="mt-0.5 text-[12.5px] text-muted">They open the door link on their phone and log in with their number and PIN. They can only scan and check in.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <Input label="Mobile" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input label="PIN (4–8 digits)" inputMode="numeric" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value })} />
        </div>
        <Button
          className="mt-3"
          loading={busy}
          onClick={async () => {
            setBusy(true);
            if (await call("/api/admin/staff", "POST", { ...f, isActive: true }, `${f.name} can now log in at /door`)) setF({ name: "", phone: "", pin: "" });
            setBusy(false);
          }}
        >
          <Plus className="size-4" /> Add
        </Button>
        <button onClick={() => navigator.clipboard.writeText(doorUrl).then(() => toast("Door link copied"))} className="ml-2 inline-flex items-center gap-1.5 text-[12.5px] text-muted underline">
          <Copy className="size-3.5" /> Copy door link
        </button>
      </div>
      <ul className="grid gap-2.5 lg:grid-cols-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-[18px] border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[14.5px] font-semibold">{r.name}</p>
                <p className="text-[12.5px] text-muted">{r.phone} · {r.lastLoginAt ? `last in ${new Date(r.lastLoginAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}` : "never logged in"}</p>
              </div>
              <Toggle label="" on={r.isActive} onChange={(v) => call(`/api/admin/staff/${r.id}`, "PATCH", { isActive: v }, v ? "Enabled" : "Disabled — logged out of the door")} />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => { const pin = prompt(`New PIN for ${r.name} (4–8 digits)`); if (pin) call(`/api/admin/staff/${r.id}`, "PATCH", { pin }, "PIN changed"); }}>
                <KeyRound className="size-3.5" /> New PIN
              </Button>
              <Button size="sm" variant="danger" onClick={() => confirm(`Remove ${r.name}?`) && call(`/api/admin/staff/${r.id}`, "DELETE", undefined, "Removed")}>
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="text-center text-[13px] text-muted">No door staff yet.</p>}
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldX, ShieldCheck, Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function BlockForm() {
  const router = useRouter();
  const toast = useToast();
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="rounded-[18px] border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold"><Ban className="size-4 text-red-hot" /> Block an IP</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto]">
        <Input label="IP address" value={ip} onChange={(e) => setIp(e.target.value)} placeholder="203.0.113.5" />
        <Input label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        <div className="flex items-end">
          <Button
            loading={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const res = await fetch("/api/admin/security/block", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip: ip.trim(), reason }) });
                if (!res.ok) throw new Error((await res.json()).error);
                toast("Blocked");
                setIp("");
                setReason("");
                router.refresh();
              } catch (e) {
                toast(e instanceof Error ? e.message : "Failed", "err");
              } finally {
                setBusy(false);
              }
            }}
          >
            <ShieldX className="size-4" /> Block
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Unblock({ ip }: { ip: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch(`/api/admin/security/block/${encodeURIComponent(ip)}`, { method: "DELETE" });
          toast("Unblocked");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
    >
      <ShieldCheck className="size-3.5" /> Unblock
    </Button>
  );
}

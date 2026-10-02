"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ScanLine, LogOut } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function StaffLogin() {
  const router = useRouter();
  const toast = useToast();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/staff/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, pin }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't log in", "err");
    } finally {
      setBusy(false);
    }
  }
  return (
    <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="mx-auto mt-10 max-w-[360px] space-y-3.5">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-gold/15 text-gold"><ScanLine className="size-7" /></span>
      <h1 className="text-center font-display text-[26px] font-extrabold">Door check-in</h1>
      <p className="text-center text-[13px] text-muted">For SyncOut door staff. Use the number and PIN your manager set up.</p>
      <Input label="Mobile" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      <Input label="PIN" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} autoComplete="one-time-code" />
      <Button type="submit" size="lg" full loading={busy}>Start scanning</Button>
    </motion.form>
  );
}

export function StaffLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/staff/logout", { method: "POST" });
        router.refresh();
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12.5px] text-muted"
    >
      <LogOut className="size-3.5" /> Log out
    </button>
  );
}

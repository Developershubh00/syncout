"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MailCheck, KeyRound } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export function ForgotForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't send", "err");
    } finally {
      setBusy(false);
    }
  }
  if (sent)
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] border border-gold/30 bg-gold/[0.06] p-5 text-center">
        <MailCheck className="mx-auto size-10 text-gold" />
        <p className="mt-3 text-[15px] font-semibold">Check your inbox</p>
        <p className="mt-1 text-[13px] text-muted">If an account uses {email}, a reset link is on its way. It works for one hour. No email? Message us on WhatsApp.</p>
      </motion.div>
    );
  return (
    <form onSubmit={submit} className="space-y-3.5">
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <Button type="submit" size="lg" full loading={busy}>Send reset link</Button>
      <p className="text-center text-[13px] text-muted"><Link href="/login" className="hover:text-text">Back to log in</Link></p>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const toast = useToast();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Password updated — log in with it now");
      router.push("/login");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update", "err");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="space-y-3.5">
      <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={6} required />
      <Button type="submit" size="lg" full loading={busy}><KeyRound className="size-4" /> Set new password</Button>
    </form>
  );
}

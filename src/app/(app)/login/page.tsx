"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/passes");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Login failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-10">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-[13.5px] text-muted">Your passes and past nights are waiting.</p>

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" size="lg" full loading={busy} className="mt-2">Log in</Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        New here?{" "}
        <Link href="/register" className="font-semibold text-red-hot">Create an account</Link>
      </p>
    </div>
  );
}

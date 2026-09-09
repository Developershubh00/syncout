"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: "", email: "", phone: "", password: "",
    gender: "female", citySlug: "new-delhi", instagram: "",
  });

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast("Account created. You're in.");
      router.push("/nights");
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't create the account", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pb-6 pt-10">
      <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight">
        Join the list
      </h1>
      <p className="mt-1.5 max-w-[36ch] text-[13.5px] leading-relaxed text-muted">
        One account, every venue. Apply once and we keep your details for next time.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-3.5">
        <Input label="Full name" placeholder="As on your ID" required value={f.name} onChange={set("name")} />
        <Input label="Email" type="email" required autoComplete="email" value={f.email} onChange={set("email")} />
        <Input label="Mobile" inputMode="numeric" placeholder="98XXXXXXXX" required value={f.phone} onChange={set("phone")} />
        <Input label="Password" type="password" hint="6+ characters" required value={f.password} onChange={set("password")} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Gender" value={f.gender} onChange={set("gender")}>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
          <Select label="City" value={f.citySlug} onChange={set("citySlug")}>
            <option value="new-delhi">New Delhi</option>
            <option value="gurugram">Gurugram</option>
            <option value="noida">Noida</option>
          </Select>
        </div>
        <Input label="Instagram" hint="Optional" placeholder="@handle" value={f.instagram} onChange={set("instagram")} />

        <p className="pt-1 text-[12px] leading-relaxed text-faint">
          By signing up you confirm you&apos;re 21 or older and will carry a government photo ID.
        </p>

        <Button type="submit" size="lg" full loading={busy}>Create account</Button>
      </form>

      <p className="mt-5 text-center text-[13px] text-muted">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-red-hot">Log in</Link>
      </p>
    </div>
  );
}

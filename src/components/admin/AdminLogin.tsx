"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { KeyRound, User } from "lucide-react";

export function AdminLogin() {
  const router = useRouter();
  const toast = useToast();
  const [mode, setMode] = useState<"password" | "key">("password");
  const [f, setF] = useState({ username: "", password: "", authKey: "" });
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "key" ? { authKey: f.authKey } : { username: f.username, password: f.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Sign-in failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 pt-12">
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight">Staff sign-in</h1>
        <p className="mt-1.5 text-[13.5px] text-muted">
          Approving lists, editing venues and running the door.
        </p>

        <div className="mt-6 flex gap-2">
          {(["password", "key"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-medium " +
                (mode === m ? "border-red bg-red/10 text-red-hot" : "border-line text-muted")
              }
            >
              {m === "password" ? <User className="size-4" /> : <KeyRound className="size-4" />}
              {m === "password" ? "Username" : "Auth key"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3.5">
          {mode === "password" ? (
            <>
              <Input
                label="Username"
                autoComplete="username"
                value={f.username}
                onChange={(e) => setF({ ...f, username: e.target.value })}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
              />
            </>
          ) : (
            <Input
              label="Auth key"
              type="password"
              placeholder="Paste the key"
              value={f.authKey}
              onChange={(e) => setF({ ...f, authKey: e.target.value })}
            />
          )}
          <Button type="submit" size="lg" full loading={busy}>Sign in</Button>
        </form>

        <p className="mt-5 text-[12px] leading-relaxed text-faint">
          Credentials come from ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_AUTH_KEY. Rotate them in
          Vercel &rarr; Settings &rarr; Environment Variables; no redeploy of code needed.
        </p>
      </div>
    </div>
  );
}

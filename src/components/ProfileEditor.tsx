"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, KeyRound, Trash2, ShieldAlert } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { LIVE_CITIES } from "@/lib/cities";

type Me = { name: string; email: string; phone: string | null; instagram: string | null; citySlug: string | null; gender: string | null };

export function ProfileEditor({ me }: { me: Me }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState({ name: me.name, phone: me.phone ?? "", instagram: me.instagram ?? "", citySlug: me.citySlug ?? "new-delhi", gender: me.gender ?? "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [del, setDel] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function call(url: string, method: string, body: unknown, label: string) {
    setBusy(label);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      return true;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
      return false;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3.5 rounded-[20px] border border-line bg-surface p-4">
        <h2 className="text-[16px]">Your details</h2>
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input label="Email" value={me.email} disabled hint="Contact us to change it" />
        <Input label="Mobile" inputMode="numeric" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="City" value={f.citySlug} onChange={(e) => setF({ ...f, citySlug: e.target.value })}>
            {LIVE_CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </Select>
          <Select label="Gender" value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })}>
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <Input label="Instagram" placeholder="@handle" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} />
        <Button
          full
          loading={busy === "save"}
          onClick={async () => {
            if (await call("/api/me", "PATCH", { ...f, gender: f.gender || null }, "save")) {
              toast("Saved");
              router.refresh();
            }
          }}
        >
          <Save className="size-4" /> Save changes
        </Button>
      </section>

      <section className="space-y-3.5 rounded-[20px] border border-line bg-surface p-4">
        <h2 className="text-[16px]">Change password</h2>
        <Input label="Current password" type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" />
        <Input label="New password" type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" />
        <Button
          full
          variant="ghost"
          loading={busy === "pw"}
          onClick={async () => {
            if (await call("/api/me/password", "POST", pw, "pw")) {
              toast("Password changed");
              setPw({ current: "", next: "" });
            }
          }}
        >
          <KeyRound className="size-4" /> Update password
        </Button>
      </section>

      <section className="space-y-3 rounded-[20px] border border-red/35 bg-red/[0.05] p-4">
        <h2 className="flex items-center gap-2 text-[16px]"><ShieldAlert className="size-4 text-red-hot" /> Delete account</h2>
        <p className="text-[12.5px] leading-relaxed text-muted">
          Erases your profile and anonymises bookings for past nights. Passes for upcoming nights keep working at the door. This can&apos;t be undone.
        </p>
        <Input label="Password to confirm" type="password" value={del} onChange={(e) => setDel(e.target.value)} autoComplete="current-password" />
        <Button
          full
          variant="danger"
          loading={busy === "del"}
          onClick={async () => {
            if (!confirm("Delete your SyncOut account for good?")) return;
            if (await call("/api/me/delete", "POST", { password: del }, "del")) {
              toast("Account deleted");
              router.push("/");
              router.refresh();
            }
          }}
        >
          <Trash2 className="size-4" /> Delete my account
        </Button>
      </section>
    </div>
  );
}

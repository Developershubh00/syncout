"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { Toggle } from "@/components/admin/ClubManager";
import { useToast } from "@/components/ui/Toast";
import type { SiteSettings, HomeSection } from "@/lib/settings.defaults";

const SECTION_NAME: Record<HomeSection["key"], string> = {
  events: "Events rail (Dandiya etc.)",
  aroundTown: "Club nights",
  hotspots: "Featured clubs",
  onTheHouse: "Offers",
  howItWorks: "How it works",
  moreClubs: "More clubs grid",
};

export function SettingsForm({ initial, status }: { initial: SiteSettings; status: { push: boolean; mail: boolean; blob: boolean } }) {
  const router = useRouter();
  const toast = useToast();
  const [s, setS] = useState<SiteSettings>(initial);
  const [busy, setBusy] = useState(false);
  const up = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }));
  const setSection = (i: number, patch: Partial<HomeSection>) =>
    setS((x) => ({ ...x, homeSections: x.homeSections.map((h, j) => (j === i ? { ...h, ...patch } : h)) }));
  const move = (i: number, d: -1 | 1) =>
    setS((x) => {
      const list = [...x.homeSections];
      const j = i + d;
      if (j < 0 || j >= list.length) return x;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...x, homeSections: list };
    });

  async function save() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setS(data.settings);
      toast("Settings saved — live now");
      router.refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Save failed", "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-[760px] space-y-6">
      <Card title="Payments" sub="Event bookings show a UPI QR for this ID. Leave it empty and bookings go to WhatsApp instead.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="UPI ID" placeholder="yourname@okicici" value={s.upiVpa} onChange={(e) => up("upiVpa", e.target.value)} />
          <Input label="Name shown on payment" value={s.payeeName} onChange={(e) => up("payeeName", e.target.value)} />
        </div>
        <p className="text-[12px] text-muted">A business/merchant UPI ID works most reliably. Or upload your printed shop QR instead:</p>
        <ImagePicker label="Static UPI QR (optional)" folder="settings" value={s.upiQrImage} onChange={(url) => up("upiQrImage", url)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="WhatsApp number" hint="with 91" value={s.whatsapp} onChange={(e) => up("whatsapp", e.target.value)} />
          <Input
            label="Hold unpaid bookings for (hours)"
            inputMode="numeric"
            value={String(s.orderHoldHours)}
            onChange={(e) => up("orderHoldHours", Number(e.target.value.replace(/\D/g, "")) || 1)}
          />
        </div>
      </Card>

      <Card title="Home page sections" sub="Turn sections on or off, rename them, change the order.">
        <ul className="space-y-2.5">
          {s.homeSections.map((h, i) => (
            <li key={h.key} className="rounded-xl border border-line bg-surface p-3">
              <div className="flex items-center gap-2">
                <Toggle label={SECTION_NAME[h.key]} on={h.visible} onChange={(v) => setSection(i, { visible: v })} />
                <div className="ml-auto flex gap-1">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded-lg p-1.5 text-muted disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                  <button onClick={() => move(i, 1)} disabled={i === s.homeSections.length - 1} className="rounded-lg p-1.5 text-muted disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input value={h.title} onChange={(e) => setSection(i, { title: e.target.value })} placeholder="Title" className="h-10 rounded-lg border border-line bg-raised px-3 text-[13px]" />
                <input value={h.sub} onChange={(e) => setSection(i, { sub: e.target.value })} placeholder="Subtitle (optional)" className="h-10 rounded-lg border border-line bg-raised px-3 text-[13px]" />
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="App" sub="">
        <div className="flex flex-wrap gap-6">
          <Toggle label="Ask visitors to install the app" on={s.installPrompt} onChange={(v) => up("installPrompt", v)} />
          <Toggle label="Floating WhatsApp button" on={s.whatsappFab} onChange={(v) => up("whatsappFab", v)} />
        </div>
      </Card>

      <Card title="Ads & analytics" sub="Paste IDs from Google Analytics, Google Ads and Meta. Booking requests are sent to each as conversions.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="GA4 measurement ID" placeholder="G-XXXXXXX" value={s.gaId} onChange={(e) => up("gaId", e.target.value)} />
          <Input label="Meta Pixel ID" placeholder="1234567890" value={s.metaPixelId} onChange={(e) => up("metaPixelId", e.target.value)} />
          <Input label="Google Ads ID" placeholder="AW-XXXXXXXXX" value={s.adsId} onChange={(e) => up("adsId", e.target.value)} />
          <Input label="Google Ads conversion label" value={s.adsLabel} onChange={(e) => up("adsLabel", e.target.value)} />
        </div>
      </Card>

      <Card title="Status" sub="Set in Vercel → Settings → Environment Variables.">
        <ul className="space-y-1.5 text-[13px]">
          <StatusRow ok={status.push} label="Phone push notifications (VAPID keys)" />
          <StatusRow ok={status.mail} label="Emails (RESEND_API_KEY + MAIL_ENABLED)" />
          <StatusRow ok={status.blob} label="Photo uploads (BLOB_READ_WRITE_TOKEN)" />
        </ul>
      </Card>

      <div className="sticky bottom-4 z-10">
        <Button size="lg" full loading={busy} onClick={save}>Save settings</Button>
      </div>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-[20px] border border-line bg-raised/50 p-4">
      <div>
        <h2 className="text-[16px]">{title}</h2>
        {sub && <p className="mt-0.5 text-[12.5px] text-muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function StatusRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="size-4 text-gold" /> : <AlertTriangle className="size-4 text-faint" />}
      <span className={ok ? "" : "text-muted"}>{label}{ok ? "" : " — off"}</span>
    </li>
  );
}

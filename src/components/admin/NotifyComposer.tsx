"use client";
import { useState } from "react";
import { Send, Users, Copy, MessageCircle, Phone, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { guestWaLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Opt = { id: string; label: string };
type Contact = { userId: string | null; name: string; phone: string | null; email: string | null };
type Result = { counts: { people: number; inApp: number; emails: number; inAppSent?: number }; contacts: Contact[] };

const NIGHT_STATUSES = [["approved", "Approved"], ["checked_in", "Checked in"], ["pending", "Pending"], ["waitlisted", "Waitlist"]] as const;
const EVENT_STATUSES = [["confirmed", "Confirmed"], ["checked_in", "Checked in"], ["payment_submitted", "Verifying"], ["awaiting_payment", "Awaiting payment"]] as const;

export function NotifyComposer({
  nights, events, initialAudience, initialTarget, mailOn, pushOn,
}: { nights: Opt[]; events: Opt[]; initialAudience?: string; initialTarget?: string; mailOn: boolean; pushOn: boolean }) {
  const toast = useToast();
  const [audience, setAudience] = useState<"night" | "event" | "all_users">(
    initialAudience === "event" ? "event" : initialAudience === "all_users" ? "all_users" : "night"
  );
  const [target, setTarget] = useState(initialTarget ?? "");
  const [statuses, setStatuses] = useState<string[]>(audience === "event" ? ["confirmed", "checked_in"] : ["approved", "checked_in"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(mailOn);
  const [busy, setBusy] = useState<"dry" | "send" | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [sent, setSent] = useState(false);

  const options = audience === "night" ? nights : audience === "event" ? events : [];
  const statusList = audience === "night" ? NIGHT_STATUSES : audience === "event" ? EVENT_STATUSES : [];

  async function run(dry: boolean) {
    if (audience !== "all_users" && !target) return toast("Pick who to message", "err");
    if (!dry && title.trim().length < 2) return toast("Add a title", "err");
    if (!dry && !confirm("Send this now? People get it immediately.")) return;
    setBusy(dry ? "dry" : "send");
    try {
      const res = await fetch(`/api/admin/notify${dry ? "?dry=1" : ""}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience, targetId: target || null, statuses, title: title.trim() || "Preview", body, url: url || null,
          channels: { inApp, email },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
      if (!dry) {
        setSent(true);
        toast(`Sent — ${data.counts.inAppSent ?? 0} in-app${email ? `, ${data.counts.emails} emails queued` : ""}`);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(null);
    }
  }

  const waText = [title.trim(), body.trim(), url ? (url.startsWith("http") ? url : `${location.origin}${url}`) : ""].filter(Boolean).join("\n\n");
  const phones = (result?.contacts ?? []).map((c) => c.phone).filter(Boolean) as string[];

  function downloadCsv() {
    const rows = [["Name", "Phone", "Email"], ...(result?.contacts ?? []).map((c) => [c.name, c.phone ?? "", c.email ?? ""])];
    const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv" }));
    a.download = "syncout-contacts.csv";
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <Select
          label="Who"
          value={audience}
          onChange={(e) => {
            const a = e.target.value as typeof audience;
            setAudience(a);
            setTarget("");
            setResult(null);
            setStatuses(a === "event" ? ["confirmed", "checked_in"] : ["approved", "checked_in"]);
          }}
        >
          <option value="night">Guests of a club night</option>
          <option value="event">Ticket holders of an event</option>
          <option value="all_users">Everyone with an account</option>
        </Select>
        {audience !== "all_users" && (
          <Select label={audience === "night" ? "Night" : "Event"} value={target} onChange={(e) => { setTarget(e.target.value); setResult(null); }}>
            <option value="">Choose…</option>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        )}
      </div>

      {statusList.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {statusList.map(([id, label]) => {
            const on = statuses.includes(id);
            return (
              <button key={id} onClick={() => setStatuses((s) => (on ? s.filter((x) => x !== id) : [...s, id]))} className={cn("rounded-full border px-3 py-1.5 text-[13px]", on ? "border-red bg-red/12" : "border-line text-muted")}>
                {label}
              </button>
            );
          })}
        </div>
      )}

      <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gates open at 6 PM tonight" />
      <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Bring your ID and booking code. Parking at gate 3." />
      <Input label="Link (optional)" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="/events/your-event" />

      <div className="flex flex-wrap gap-4 rounded-2xl border border-line bg-raised p-3.5 text-[13.5px]">
        <label className="flex items-center gap-2"><input type="checkbox" checked={inApp} onChange={(e) => setInApp(e.target.checked)} /> In-app popup &amp; bell{pushOn ? " + phone push" : ""}</label>
        <label className={cn("flex items-center gap-2", !mailOn && "opacity-50")}>
          <input type="checkbox" checked={email} disabled={!mailOn} onChange={(e) => setEmail(e.target.checked)} /> Email {mailOn ? "" : "(turn on Resend first)"}
        </label>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="ghost" loading={busy === "dry"} onClick={() => run(true)}><Users className="size-4" /> Show recipients</Button>
        <Button loading={busy === "send"} disabled={sent} onClick={() => run(false)}><Send className="size-4" /> {sent ? "Sent" : "Send now"}</Button>
      </div>

      {result && (
        <div className="rounded-[18px] border border-line bg-surface p-4">
          <p className="text-[13.5px]">
            <b>{result.counts.people}</b> people · <b>{result.counts.inApp}</b> reachable in-app · <b>{result.counts.emails}</b> by email
          </p>
          <p className="mt-1 text-[12px] text-muted">Guests without an account only get email or WhatsApp. WhatsApp opens one chat at a time with your message filled in.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={async () => { await navigator.clipboard.writeText(phones.join(", ")); toast(`${phones.length} numbers copied`); }}>
              <Copy className="size-3.5" /> Copy all numbers
            </Button>
            <Button size="sm" variant="ghost" onClick={downloadCsv}><Download className="size-3.5" /> CSV</Button>
          </div>
          <ul className="mt-3 max-h-[420px] divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {result.contacts.map((c, i) => (
              <li key={`${c.phone}-${i}`} className="flex items-center gap-2 px-3 py-2.5 text-[13px]">
                <span className="min-w-0 flex-1 truncate">{c.name}<span className="ml-2 text-faint">{c.phone}</span></span>
                {c.phone && (
                  <>
                    <a href={guestWaLink(c.phone, waText || `Hi ${c.name.split(" ")[0]}, this is SyncOut.`)} target="_blank" rel="noreferrer" className="rounded-lg bg-[#25D366]/15 p-2 text-[#25D366]" aria-label={`WhatsApp ${c.name}`}>
                      <MessageCircle className="size-4" />
                    </a>
                    <a href={`tel:${c.phone}`} className="rounded-lg bg-raised p-2" aria-label={`Call ${c.name}`}><Phone className="size-4" /></a>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

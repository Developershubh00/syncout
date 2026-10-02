"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, MessageCircle, Mail, Link2, Ban, ShieldCheck, Trash2, KeyRound, Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { guestWaLink } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

function useAct() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  async function act(label: string, url: string, method: string, body?: unknown, ok?: string) {
    setBusy(label);
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (ok) toast(ok);
      router.refresh();
      return data;
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed", "err");
    } finally {
      setBusy(null);
    }
  }
  return { busy, act, toast };
}

const Contact = ({ phone, email, wa }: { phone?: string | null; email?: string | null; wa: string }) => (
  <div className="flex flex-wrap gap-2">
    {phone && (
      <>
        <a href={`tel:${phone}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-raised px-2.5 text-[12.5px]"><Phone className="size-3.5" /> {phone}</a>
        <a href={guestWaLink(phone, wa)} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#25D366]/15 px-2.5 text-[12.5px] text-[#25D366]"><MessageCircle className="size-3.5" /> WhatsApp</a>
      </>
    )}
    {email && <a href={`mailto:${email}`} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-raised px-2.5 text-[12.5px]"><Mail className="size-3.5" /> {email}</a>}
  </div>
);

export function UserRow({ u }: { u: { id: string; name: string; email: string; phone: string | null; isBlocked: boolean; createdAt: string; bookings: number; orders: number } }) {
  const { busy, act, toast } = useAct();
  const [link, setLink] = useState<string | null>(null);
  return (
    <li className={cn("rounded-[18px] border bg-surface p-4", u.isBlocked ? "border-red/40" : "border-line")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold">{u.name} {u.isBlocked && <span className="ml-1 rounded-md bg-red/15 px-1.5 py-0.5 text-[10.5px] text-red-hot">blocked</span>}</p>
          <p className="mt-0.5 text-[12px] text-faint">Joined {new Date(u.createdAt).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })} · {u.bookings} guestlist · {u.orders} tickets</p>
        </div>
      </div>
      <div className="mt-3"><Contact phone={u.phone} email={u.email} wa={`Hi ${u.name.split(" ")[0]}, this is SyncOut.`} /></div>
      {link && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-raised p-2.5 text-[12px]">
          <span className="min-w-0 flex-1 truncate text-muted">{link}</span>
          <button onClick={() => navigator.clipboard.writeText(link).then(() => toast("Link copied"))} className="rounded-md p-1.5" aria-label="Copy link"><Copy className="size-3.5" /></button>
          {u.phone && <a href={guestWaLink(u.phone, `Hi ${u.name.split(" ")[0]}, here's your SyncOut password reset link (valid 1 hour): ${link}`)} target="_blank" rel="noreferrer" className="rounded-md bg-[#25D366]/15 px-2 py-1 text-[#25D366]">Send</a>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="ghost" loading={busy === "reset"} onClick={async () => { const d = await act("reset", `/api/admin/users/${u.id}/reset`, "POST"); if (d?.link) setLink(d.link); }}>
          <KeyRound className="size-3.5" /> Password reset link
        </Button>
        <Button size="sm" variant="ghost" loading={busy === "block"} onClick={() => act("block", `/api/admin/users/${u.id}`, "PATCH", { isBlocked: !u.isBlocked }, u.isBlocked ? "Unblocked" : "Blocked")}>
          {u.isBlocked ? <ShieldCheck className="size-3.5" /> : <Ban className="size-3.5" />} {u.isBlocked ? "Unblock" : "Block"}
        </Button>
        <Button size="sm" variant="danger" loading={busy === "del"} onClick={() => confirm(`Delete ${u.name}'s account? Past bookings are anonymised.`) && act("del", `/api/admin/users/${u.id}`, "DELETE", undefined, "Account deleted")}>
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </li>
  );
}

const KIND_LABEL: Record<string, string> = { general: "General", booking: "Booking help", partner: "Venue / organiser", press: "Press", careers: "Careers", volunteer: "Volunteer" };

export function InquiryRow({ q }: { q: { id: string; kind: string; name: string; email: string | null; phone: string | null; message: string; status: string; createdAt: string } }) {
  const { busy, act } = useAct();
  return (
    <li className={cn("rounded-[18px] border bg-surface p-4", q.status === "new" ? "border-gold/35" : "border-line")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14.5px] font-semibold">{q.name}</p>
        <span className="shrink-0 rounded-md bg-raised px-1.5 py-0.5 text-[11px] text-muted">{KIND_LABEL[q.kind] ?? q.kind}</span>
      </div>
      <p className="mt-0.5 text-[11.5px] text-faint">{new Date(q.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
      <p className="mt-2.5 whitespace-pre-line text-[13.5px] leading-relaxed text-white/80">{q.message}</p>
      <div className="mt-3"><Contact phone={q.phone} email={q.email} wa={`Hi ${q.name.split(" ")[0]}, thanks for writing to SyncOut.`} /></div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant={q.status === "new" ? "gold" : "ghost"} loading={busy === "s"} onClick={() => act("s", `/api/admin/inquiries/${q.id}`, "PATCH", { status: q.status === "new" ? "handled" : "new" })}>
          <Check className="size-3.5" /> {q.status === "new" ? "Mark handled" : "Mark new"}
        </Button>
        <Button size="sm" variant="ghost" loading={busy === "d"} onClick={() => confirm("Delete this message?") && act("d", `/api/admin/inquiries/${q.id}`, "DELETE")}><Trash2 className="size-3.5" /></Button>
      </div>
    </li>
  );
}

const APP_STATUS = ["new", "shortlisted", "hired", "rejected"] as const;

export function ApplicationRow({ a }: { a: { id: string; roleTitle: string; kind: string; name: string; email: string; phone: string; city: string | null; link: string | null; message: string | null; status: string; createdAt: string } }) {
  const { busy, act } = useAct();
  return (
    <li className="rounded-[18px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14.5px] font-semibold">{a.name}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">{a.roleTitle} · {a.kind}{a.city ? ` · ${a.city}` : ""}</p>
        </div>
        <span className={cn("shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold", a.status === "shortlisted" || a.status === "hired" ? "bg-gold/15 text-gold" : a.status === "rejected" ? "bg-red/12 text-red-hot" : "bg-raised text-muted")}>{a.status}</span>
      </div>
      {a.message && <p className="mt-2.5 line-clamp-4 whitespace-pre-line text-[13px] leading-relaxed text-white/75">{a.message}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Contact phone={a.phone} email={a.email} wa={`Hi ${a.name.split(" ")[0]}, this is SyncOut about your application for ${a.roleTitle}.`} />
        {a.link && <a href={a.link} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-raised px-2.5 text-[12.5px]"><Link2 className="size-3.5" /> Profile / resume <ExternalLink className="size-3" /></a>}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {APP_STATUS.filter((s) => s !== a.status).map((s) => (
          <Button key={s} size="sm" variant={s === "shortlisted" || s === "hired" ? "gold" : "ghost"} loading={busy === s} onClick={() => act(s, `/api/admin/applications/${a.id}`, "PATCH", { status: s }, `Marked ${s}`)}>
            {s[0].toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>
    </li>
  );
}

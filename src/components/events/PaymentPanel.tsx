"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Smartphone, MessageCircle, ShieldCheck, Clock } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { ThankYouSplash } from "@/components/fx/ThankYouSplash";
import { waLink, paymentProofMessage, bookingEnquiryMessage } from "@/lib/whatsapp";
import { rs } from "@/lib/event-format";
import { track } from "@/lib/track";

export type PaymentProps = {
  code: string;
  k: string | null;
  status: string;
  mode: string;
  amount: number;
  whatsapp: string;
  holdHours: number;
  upi: { vpa: string | null; payee: string; link: string | null; qrSvg: string | null; qrImage: string | null } | null;
  order: { eventTitle: string; venue: string; dayLabel: string; tierName: string; quantity: number; name: string; phone: string };
};

/** Pay by UPI QR, then send proof on WhatsApp. Admin verifies and confirms. */
export function PaymentPanel(p: PaymentProps) {
  const router = useRouter();
  const toast = useToast();
  const [utr, setUtr] = useState("");
  const [mobile, setMobile] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => setMobile(/android|iphone|ipad|ipod/i.test(navigator.userAgent)), []);

  const base = { code: p.code, eventTitle: p.order.eventTitle, venue: p.order.venue, dayLabel: p.order.dayLabel, tierName: p.order.tierName, quantity: p.order.quantity, amount: p.amount, name: p.order.name, phone: p.order.phone };
  const proofHref = waLink(p.whatsapp, paymentProofMessage({ ...base, utr: utr.trim() || null }));
  const enquiryHref = waLink(p.whatsapp, bookingEnquiryMessage(base));

  function record(enquiry: boolean) {
    fetch(`/api/orders/${p.code}/paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utr: utr.trim(), k: p.k, enquiry }),
      keepalive: true,
    }).catch(() => {});
    track(enquiry ? "whatsapp_click" : "payment_proof_sent", { value: p.amount, label: p.order.eventTitle });
    setTimeout(() => setSent(true), 400);
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied");
    } catch {
      toast("Couldn't copy — long-press to select", "err");
    }
  }

  const splash = (
    <ThankYouSplash
      open={sent}
      festive={false}
      title={p.mode === "whatsapp" ? "Sent to WhatsApp" : "Payment sent for checking"}
      body={p.mode === "whatsapp" ? "We'll reply there with payment details." : "We'll confirm your tickets here and on WhatsApp shortly."}
      autoMs={2200}
      onDone={() => {
        setSent(false);
        router.refresh();
      }}
    />
  );

  if (p.status === "payment_submitted") {
    return (
      <div className="rounded-[20px] border border-gold/25 bg-gold/[0.06] p-4">
        <p className="flex items-center gap-2 text-[14px] font-semibold text-gold"><Clock className="size-4" /> {p.mode === "free" ? "Waiting for confirmation" : "Checking your payment"}</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          {p.mode === "free"
            ? "We'll confirm your spot shortly. You'll get a notification and an email."
            : "Usually within the hour. You'll get a notification here, on WhatsApp and by email the moment it's confirmed."}
        </p>
        {p.mode !== "free" && (
          <a href={proofHref} target="_blank" rel="noreferrer" onClick={() => record(false)} className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-xl bg-raised text-[13.5px] font-semibold">
            <MessageCircle className="size-4 text-[#25D366]" /> Send the screenshot again
          </a>
        )}
        {splash}
      </div>
    );
  }

  if (p.mode === "whatsapp" || !p.upi) {
    return (
      <div className="rounded-[20px] border border-line bg-surface p-4">
        <p className="text-[14px] font-semibold">Finish on WhatsApp</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
          Send your booking to SyncOut on WhatsApp. We&apos;ll share the payment details there and confirm your {rs(p.amount)} booking.
        </p>
        <a href={enquiryHref} target="_blank" rel="noreferrer" onClick={() => record(true)} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[15px] font-semibold text-white">
          <MessageCircle className="size-5" /> Send booking on WhatsApp
        </a>
        {splash}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[14px] font-semibold">Pay {p.upi.payee}</p>
        <p className="font-display text-[26px] font-extrabold text-gold">{rs(p.amount)}</p>
      </div>
      <p className="mt-1 text-[12.5px] text-muted">Hold expires in {p.holdHours} hours if unpaid. Add the code <b className="text-text">{p.code}</b> in the payment note.</p>

      <div className="mx-auto mt-4 w-full max-w-[260px] rounded-2xl bg-white p-3">
        {p.upi.qrSvg ? (
          <div className="[&>svg]:h-auto [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: p.upi.qrSvg }} />
        ) : p.upi.qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.upi.qrImage} alt={`UPI QR to pay ${p.upi.payee}`} className="h-auto w-full" />
        ) : null}
      </div>
      <p className="mt-2 text-center text-[12px] text-muted">Scan with GPay, PhonePe, Paytm or any UPI app</p>

      {p.upi.vpa && (
        <button onClick={() => copy(p.upi!.vpa!)} className="mx-auto mt-2 flex items-center gap-1.5 rounded-lg bg-raised px-3 py-1.5 text-[12.5px] font-semibold">
          {p.upi.vpa} <Copy className="size-3.5 text-muted" />
        </button>
      )}

      {mobile && p.upi.link && (
        <a href={p.upi.link} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-red text-[15px] font-semibold text-white">
          <Smartphone className="size-4" /> Pay {rs(p.amount)} with a UPI app
        </a>
      )}

      <div className="mt-5 border-t border-line pt-4">
        <label className="block">
          <span className="mb-1.5 block text-[12.5px] font-medium text-muted">UPI reference / UTR (optional, speeds things up)</span>
          <input
            value={utr}
            onChange={(e) => setUtr(e.target.value.replace(/[^0-9A-Za-z]/g, "").slice(0, 30))}
            inputMode="numeric"
            placeholder="12-digit UTR from your UPI app"
            className="h-11 w-full rounded-xl border border-line bg-raised px-3.5 text-[14px]"
          />
        </label>
        <a href={proofHref} target="_blank" rel="noreferrer" onClick={() => record(false)} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[15px] font-semibold text-white">
          <MessageCircle className="size-5" /> I&apos;ve paid — send screenshot on WhatsApp
        </a>
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11.5px] text-faint">
          <ShieldCheck className="size-3.5" /> Tickets are confirmed after we check the payment.
        </p>
      </div>
      {splash}
    </div>
  );
}

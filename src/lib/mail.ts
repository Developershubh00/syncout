/**
 * Email is wired but dormant until RESEND_API_KEY + MAIL_ENABLED=true are set.
 * Until then every send is logged to the server console so nothing blocks.
 *
 * Every value that came from a form is escaped before it goes into HTML —
 * guests type their own names, and anyone can apply with any address.
 */
import { Resend } from "resend";
import { absUrl } from "./site";

const enabled = process.env.MAIL_ENABLED === "true" && !!process.env.RESEND_API_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.MAIL_FROM ?? "SyncOut <guestlist@syncout.in>";

type Mail = { to: string; subject: string; html: string };

export function esc(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Strip CR/LF so nothing typed into a form can add headers to a subject. */
const subj = (s: string) => s.replace(/[\r\n]+/g, " ").slice(0, 160);

export async function sendMail({ to, subject, html }: Mail) {
  if (!enabled || !resend) {
    console.log(`[mail:skipped] to=${to} subject="${subj(subject)}"`);
    return { skipped: true };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject: subj(subject), html });
    return { sent: true };
  } catch (e) {
    console.error("[mail:error]", e);
    return { error: true };
  }
}

/** Send several, a few at a time, never throwing. */
export async function sendMany(list: Mail[], concurrency = 5) {
  let i = 0;
  const worker = async () => {
    while (i < list.length) {
      const m = list[i++];
      await sendMail(m);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
}

const shell = (body: string) => `
<div style="background:#08080a;padding:32px 0;font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#121216;border:1px solid #26262e;border-radius:20px;overflow:hidden">
    <div style="padding:22px 26px;border-bottom:1px solid #26262e">
      <span style="color:#e4113c;font-size:20px;font-weight:800;letter-spacing:-.02em">SyncOut</span>
    </div>
    <div style="padding:26px;color:#e8e8ee;font-size:15px;line-height:1.6">${body}</div>
    <div style="padding:18px 26px;border-top:1px solid #26262e;color:#7a7a86;font-size:12px">
      Carry a government photo ID. Entry is at the venue's discretion.
    </div>
  </div>
</div>`;

const button = (href: string, label: string) =>
  `<p style="margin:22px 0 4px"><a href="${esc(href)}" style="display:inline-block;background:#e4113c;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px">${esc(label)}</a></p>`;

const codeBox = (label: string, code: string) =>
  `<p style="margin:20px 0;padding:14px 16px;background:#1b1b21;border-radius:12px">${esc(label)} <b style="color:#f2c14e;letter-spacing:.1em;font-size:18px">${esc(code)}</b></p>`;

/* ── guestlist ── */

export function guestlistReceivedEmail(o: { name: string; event: string; club: string; date: string; code: string; url: string }) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p>Your guestlist request for <b>${esc(o.event)}</b> at <b>${esc(o.club)}</b> on ${esc(o.date)} is in.</p>
    ${codeBox("Reference", o.code)}
    <p>We confirm every list by 6 PM on the day. You'll get one more email either way — watch for it.</p>
    ${button(absUrl(o.url), "Open your pass")}`);
}

export function guestlistApprovedEmail(o: {
  name: string; event: string; club: string; date: string; code: string; guests: number; url: string;
}) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p><b style="color:#f2c14e">You're on the list.</b></p>
    <p><b>${esc(o.event)}</b> · ${esc(o.club)}<br/>${esc(o.date)} · ${esc(o.guests)} guest${o.guests > 1 ? "s" : ""}</p>
    ${codeBox("Show this code at the door:", o.code)}
    <p>Your entry, food and drinks are on us. Reach by 10:30 PM — the list stops being honoured after that.</p>
    ${button(absUrl(o.url), "Open your pass")}`);
}

export function guestlistRejectedEmail(o: { name: string; event: string; reason?: string | null }) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p>We couldn't fit you in for <b>${esc(o.event)}</b> — the list filled up.${o.reason ? ` ${esc(o.reason)}` : ""}</p>
    <p>Nothing was charged. Apply for another night and you'll be higher in the queue.</p>`);
}

/* ── event tickets ── */

export function orderReceivedEmail(o: {
  name: string; event: string; venue: string; date: string; code: string; tickets: string; amount: string; url: string;
  free?: boolean;
}) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p>Your booking for <b>${esc(o.event)}</b> at ${esc(o.venue)} on ${esc(o.date)} is requested.</p>
    ${codeBox("Booking", o.code)}
    <p>${esc(o.tickets)} · <b>${esc(o.amount)}</b></p>
    <p>${
      o.free
        ? "We'll confirm your spot shortly."
        : "Finish payment from your booking page — scan the UPI QR, then send the screenshot on WhatsApp. Tickets are confirmed once we've checked it."
    }</p>
    ${button(absUrl(o.url), o.free ? "View booking" : "Pay & finish booking")}`);
}

export function orderConfirmedEmail(o: {
  name: string; event: string; venue: string; date: string; code: string; tickets: string; url: string;
}) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p><b style="color:#f2c14e">Your tickets are confirmed.</b></p>
    <p><b>${esc(o.event)}</b> · ${esc(o.venue)}<br/>${esc(o.date)} · ${esc(o.tickets)}</p>
    ${codeBox("Show this at the entry:", o.code)}
    ${button(absUrl(o.url), "Open your ticket")}`);
}

export function orderRejectedEmail(o: { name: string; event: string; code: string; reason?: string | null; url: string }) {
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p>We couldn't confirm booking <b>${esc(o.code)}</b> for <b>${esc(o.event)}</b>.${o.reason ? ` ${esc(o.reason)}` : ""}</p>
    <p>If you've already paid, reply on WhatsApp with your payment screenshot and we'll sort it out.</p>
    ${button(absUrl(o.url), "View booking")}`);
}

/* ── admin broadcast ── */

export function broadcastEmail(o: { name: string; title: string; body: string; url?: string | null }) {
  const paragraphs = esc(o.body)
    .split(/\n{2,}/)
    .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return shell(`
    <p>Hi ${esc(o.name)},</p>
    <p><b>${esc(o.title)}</b></p>
    ${paragraphs}
    ${o.url ? button(o.url.startsWith("http") ? o.url : absUrl(o.url), "Open") : ""}`);
}

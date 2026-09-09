/**
 * Email is wired but dormant until RESEND_API_KEY + MAIL_ENABLED=true are set.
 * Until then every send is logged to the server console so nothing blocks.
 */
import { Resend } from "resend";

const enabled = process.env.MAIL_ENABLED === "true" && !!process.env.RESEND_API_KEY;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.MAIL_FROM ?? "SyncOut <guestlist@syncout.in>";

type Mail = { to: string; subject: string; html: string };

export async function sendMail({ to, subject, html }: Mail) {
  if (!enabled || !resend) {
    console.log(`[mail:skipped] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  try {
    await resend.emails.send({ from: FROM, to, subject, html });
    return { sent: true };
  } catch (e) {
    console.error("[mail:error]", e);
    return { error: true };
  }
}

const shell = (body: string) => `
<div style="background:#08080a;padding:32px 0;font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,sans-serif">
  <div style="max-width:520px;margin:0 auto;background:#121216;border:1px solid #26262e;border-radius:20px;overflow:hidden">
    <div style="padding:22px 26px;border-bottom:1px solid #26262e">
      <span style="color:#e4113c;font-size:20px;font-weight:800;letter-spacing:-.02em">SyncOut</span>
    </div>
    <div style="padding:26px;color:#e8e8ee;font-size:15px;line-height:1.6">${body}</div>
    <div style="padding:18px 26px;border-top:1px solid #26262e;color:#7a7a86;font-size:12px">
      Carry a government photo ID. Entry is at the venue's discretion. 21+ only.
    </div>
  </div>
</div>`;

export function guestlistReceivedEmail(o: { name: string; event: string; club: string; date: string; code: string }) {
  return shell(`
    <p>Hi ${o.name},</p>
    <p>Your guestlist request for <b>${o.event}</b> at <b>${o.club}</b> on ${o.date} is in.</p>
    <p style="margin:20px 0;padding:14px 16px;background:#1b1b21;border-radius:12px">
      Reference <b style="color:#f2c14e;letter-spacing:.08em">${o.code}</b>
    </p>
    <p>We confirm every list by 6 PM on the day. You'll get one more email either way — watch for it.</p>`);
}

export function guestlistApprovedEmail(o: { name: string; event: string; club: string; date: string; code: string; guests: number; url: string }) {
  return shell(`
    <p>Hi ${o.name},</p>
    <p><b style="color:#f2c14e">You're on the list.</b></p>
    <p><b>${o.event}</b> · ${o.club}<br/>${o.date} · ${o.guests} guest${o.guests > 1 ? "s" : ""}</p>
    <p style="margin:20px 0;padding:14px 16px;background:#1b1b21;border-radius:12px">
      Show this code at the door: <b style="color:#f2c14e;letter-spacing:.1em;font-size:18px">${o.code}</b>
    </p>
    <p>Your entry, food and drinks are on us. Reach by 10:30 PM — the list stops being honoured after that.</p>
    <p><a href="${o.url}" style="color:#e4113c">Open your pass</a></p>`);
}

export function guestlistRejectedEmail(o: { name: string; event: string; reason?: string }) {
  return shell(`
    <p>Hi ${o.name},</p>
    <p>We couldn't fit you in for <b>${o.event}</b> — the list filled up.${o.reason ? ` ${o.reason}` : ""}</p>
    <p>Nothing was charged. Apply for another night and you'll be higher in the queue.</p>`);
}

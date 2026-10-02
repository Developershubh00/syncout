import { NextResponse } from "next/server";
import { db } from "@/db";
import { inquiries } from "@/db/schema";
import { inquirySchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { sendMail, esc } from "@/lib/mail";
import { later } from "@/lib/notify";

export async function POST(req: Request) {
  const rl = rateLimit(`contact:${clientIp(req)}`, 5, 30 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many messages — try WhatsApp instead." }, { status: 429 });
  const parsed = inquirySchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot

  await db.insert(inquiries).values({ kind: d.kind, name: d.name, email: d.email || null, phone: d.phone || null, message: d.message });
  const s = await getSettings();
  later(() =>
    sendMail({
      to: s.supportEmail,
      subject: `New ${d.kind} message from ${d.name}`,
      html: `<p><b>${esc(d.name)}</b> (${esc(d.email || "")} ${esc(d.phone || "")})</p><p>${esc(d.message).replace(/\n/g, "<br/>")}</p>`,
    })
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { jobApplications } from "@/db/schema";
import { applicationSchema } from "@/lib/validators";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { readJson } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { sendMail, esc } from "@/lib/mail";
import { later } from "@/lib/notify";

export async function POST(req: Request) {
  const rl = rateLimit(`apply:${clientIp(req)}`, 6, 60 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many applications from here — try again later." }, { status: 429 });
  const parsed = applicationSchema.safeParse(await readJson(req));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Check the form" }, { status: 422 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });
  const link = d.link && !/^https?:\/\//i.test(d.link) ? `https://${d.link}` : d.link || null;

  await db.insert(jobApplications).values({
    openingId: d.openingId || null, roleTitle: d.roleTitle, kind: d.kind, name: d.name, email: d.email.toLowerCase(),
    phone: d.phone, city: d.city || null, link, message: d.message || null,
  });
  const s = await getSettings();
  later(() =>
    sendMail({
      to: s.supportEmail,
      subject: `Application: ${d.roleTitle} — ${d.name}`,
      html: `<p><b>${esc(d.name)}</b> · ${esc(d.email)} · ${esc(d.phone)} · ${esc(d.city || "")}</p><p>${esc(link || "")}</p><p>${esc(d.message || "").replace(/\n/g, "<br/>")}</p>`,
    })
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}

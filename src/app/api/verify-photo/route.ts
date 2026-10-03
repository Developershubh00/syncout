import { NextResponse } from "next/server";
import { guard } from "@/lib/api";
import { uploadImage, MAX_UPLOAD_BYTES, sniffImage } from "@/lib/blob";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Guest-facing: a verification photo for a screened guestlist (e.g. the Skyra
 * launch). Rate-limited, size-capped and magic-byte checked, stored in its own
 * folder. The URL is attached to the booking by /api/orders.
 */
export async function POST(req: Request) {
  { const g = await guard(req); if (g) return g; }
  const rl = rateLimit(`verify:${clientIp(req)}`, 12, 15 * 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads — wait a few minutes." }, { status: 429 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No photo received" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Photos must be under 6 MB" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return NextResponse.json({ error: "Use a JPG, PNG or WebP photo" }, { status: 415 });

  try {
    const url = await uploadImage(bytes, type, "verify");
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[verify-photo]", e);
    return NextResponse.json({ error: "Upload failed — please try again." }, { status: 500 });
  }
}

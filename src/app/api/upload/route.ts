import { NextResponse } from "next/server";
import { uploadImage, MAX_UPLOAD_BYTES, sniffImage } from "@/lib/blob";
import { getAdmin } from "@/lib/session";

export const runtime = "nodejs";

/** Admin-only image upload. Nothing guest-facing uploads files today. */
export async function POST(req: Request) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Admins only" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? "uploads");

  if (!(file instanceof File)) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "Images must be under 6 MB" }, { status: 413 });

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return NextResponse.json({ error: "Use a JPG, PNG or WebP image" }, { status: 415 });

  try {
    const url = await uploadImage(bytes, type, folder);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed. Check BLOB_READ_WRITE_TOKEN." }, { status: 500 });
  }
}

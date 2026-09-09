import { NextResponse } from "next/server";
import { uploadImage, MAX_UPLOAD_BYTES, ALLOWED_TYPES } from "@/lib/blob";
import { getAdmin, getUser } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const [admin, user] = await Promise.all([getAdmin(), getUser()]);
  if (!admin && !user) return NextResponse.json({ error: "Log in to upload" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") ?? (admin ? "venues" : "guests"));

  if (!(file instanceof File)) return NextResponse.json({ error: "No file received" }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES)
    return NextResponse.json({ error: "Images must be under 6 MB" }, { status: 413 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: "Use a JPG, PNG or WebP" }, { status: 415 });

  try {
    const url = await uploadImage(file, folder);
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed. Check BLOB_READ_WRITE_TOKEN." }, { status: 500 });
  }
}

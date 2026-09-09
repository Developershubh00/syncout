import { put, del } from "@vercel/blob";

export async function uploadImage(file: File, folder = "uploads") {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const blob = await put(key, file, { access: "public", addRandomSuffix: false });
  return blob.url;
}

export async function deleteImage(url: string) {
  try {
    await del(url);
  } catch {
    /* already gone */
  }
}

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

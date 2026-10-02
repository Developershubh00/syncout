import { put, del } from "@vercel/blob";

export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const UPLOAD_FOLDERS = ["venues", "nights", "events", "announcements", "offers", "settings", "uploads"];

/** Check the file really is the image type it claims, from its first bytes. */
export function sniffImage(buf: Uint8Array): string | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  )
    return "image/webp";
  return null;
}

export async function uploadImage(bytes: Uint8Array, type: string, folder = "uploads") {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not set");
  }
  const safeFolder = UPLOAD_FOLDERS.includes(folder) ? folder : "uploads";
  // Extension comes from the verified type, never from the uploaded filename.
  const key = `${safeFolder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[type]}`;
  const blob = await put(key, Buffer.from(bytes), { access: "public", addRandomSuffix: false, contentType: type });
  return blob.url;
}

export async function deleteImage(url: string) {
  try {
    await del(url);
  } catch {
    /* already gone */
  }
}

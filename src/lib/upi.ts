import "server-only";
import QRCode from "qrcode";

/**
 * A UPI intent link. Built by hand rather than URLSearchParams, because some
 * UPI apps show a literal "+" where URLSearchParams encodes a space.
 */
export function upiLink(o: { vpa: string; name: string; amount: number; note: string }) {
  const enc = encodeURIComponent;
  return (
    `upi://pay?pa=${enc(o.vpa.trim())}` +
    `&pn=${enc(o.name.trim() || "SyncOut")}` +
    `&am=${enc(o.amount.toFixed(2))}` +
    `&cu=INR` +
    `&tn=${enc(o.note.slice(0, 50))}`
  );
}

/** QR as an inline SVG string. Dark modules on white so every scanner reads it. */
export async function qrSvg(text: string) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#08080a", light: "#ffffff" },
  });
}

/** Loose check for a UPI ID like name@bank. */
export function looksLikeVpa(v?: string | null) {
  return Boolean(v && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-]{1,64}$/.test(v.trim()));
}

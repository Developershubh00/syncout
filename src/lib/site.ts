/** Public-facing basics. Safe to import from client or server. */
function baseUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit && !explicit.includes("localhost")) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return (explicit || "http://localhost:3000").replace(/\/$/, "");
}

export const SITE = {
  name: "SyncOut",
  url: baseUrl(),
  tagline: "Guestlists, club nights and Dandiya events in Delhi, Gurugram and Noida",
  description:
    "Get on the guestlist at Delhi NCR's best clubs and book Dandiya, Garba and party events in Delhi, Gurugram and Noida. Free entry on approved lists — apply before 6 PM.",
  locale: "en_IN",
  /** Default WhatsApp number for bookings and payment proofs (country code + number). */
  whatsapp: "918851410021",
};

export function absUrl(path = "/") {
  return SITE.url + (path.startsWith("/") ? path : `/${path}`);
}

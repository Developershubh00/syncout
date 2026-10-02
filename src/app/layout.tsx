import type { Metadata, Viewport } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import localFont from "next/font/local";
import { SITE } from "@/lib/site";
import "./globals.css";

// Self-hosted (same files Google served), preloaded from our own domain — no
// render-blocking stylesheet from fonts.googleapis.com before text can paint.
const sans = localFont({ src: "./fonts/inter-latin-wght.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const display = localFont({
  src: "./fonts/bricolage-latin-opsz.woff2",
  weight: "200 800",
  variable: "--font-bricolage",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: {
    default: "SyncOut — Guestlists & Dandiya Nights in Delhi, Gurugram, Noida",
    template: "%s · SyncOut",
  },
  description: SITE.description,
  keywords: [
    "guestlist delhi", "club guestlist gurugram", "clubs in noida", "free entry clubs delhi", "nightlife delhi ncr",
    "dandiya night 2026", "dandiya delhi", "dandiya gurugram", "dandiya noida", "garba night delhi", "navratri events 2026",
  ],
  category: "entertainment",
  manifest: "/manifest.json",
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }, { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "SyncOut" },
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    title: "SyncOut — Guestlists & Dandiya Nights in Delhi NCR",
    description: "Free entry on approved guestlists at Delhi NCR's best clubs, plus Dandiya & Garba passes for Navratri 2026.",
    url: SITE.url,
  },
  twitter: { card: "summary_large_image", title: "SyncOut — Guestlists & Dandiya Nights in Delhi NCR", description: SITE.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } } : {}),
};

export const viewport: Viewport = {
  themeColor: "#08080a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${sans.variable} ${display.variable}`}>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { NextConfig } from "next";

const CSP = "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://images.unsplash.com https://sync.quickrpe.com https://*.cdninstagram.com https://*.fbcdn.net https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.instagram.com https://*.instagram.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.googleadservices.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self' https://www.instagram.com https://*.instagram.com https://td.doubleclick.net; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://connect.facebook.net https://graph.facebook.com https://vitals.vercel-insights.com https://*.instagram.com; media-src 'self' https://*.cdninstagram.com; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests";

const config: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF first — usually 20–30% smaller than WebP on phones; optimised images are kept a month.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "sync.quickrpe.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: { optimizePackageImports: ["lucide-react", "framer-motion"] },
  async headers() {
    return [
      {
        // The service worker must never be served stale, or fixes can't reach installed apps.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/manifest.json", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/clubs/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      { source: "/icons/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }] },
      {
        source: "/events/:file*.svg",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default config;

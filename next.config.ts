import type { NextConfig } from "next";

const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "sync.quickrpe.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default config;

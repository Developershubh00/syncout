import type { MetadataRoute } from "next";
import { absUrl, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/passes/", "/tickets/", "/notifications", "/login", "/register", "/search"],
      },
    ],
    sitemap: absUrl("/sitemap.xml"),
    host: SITE.url,
  };
}

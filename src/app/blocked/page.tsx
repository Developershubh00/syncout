import type { Metadata } from "next";
import { headers } from "next/headers";
import { BlockedView } from "@/components/BlockedView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Request blocked", robots: { index: false, follow: false } };

/** Shown when the firewall blocks a request. The IP is the visitor's own, read server-side. */
export default async function Blocked() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const country = h.get("x-vercel-ip-country") || null;
  const ref = h.get("x-sec-ref") || null;
  return <BlockedView ip={ip} country={country} ref={ref} at={new Date().toISOString()} />;
}

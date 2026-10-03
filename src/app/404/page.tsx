import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

// The middleware rewrites real "page not found" hits here. Next's own not-found.tsx
// renders the same thing; this route lets the firewall return a 404 without leaking paths.
export const metadata: Metadata = { title: "Page not found", robots: { index: false } };
export default function Page() {
  return <NotFoundView />;
}

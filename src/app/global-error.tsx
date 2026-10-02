"use client";
import { markSvg } from "@/components/brand/mark";

/** Last line of defence if even the root layout fails. Plain HTML — nothing here can fail too. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#08080a", color: "#f5f5f7", fontFamily: "ui-sans-serif, system-ui, sans-serif", textAlign: "center", padding: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", fontWeight: 800, fontSize: 26, letterSpacing: "-0.04em" }}>
            <span dangerouslySetInnerHTML={{ __html: markSvg({ size: 52 }) }} />
            <span>sync<span style={{ color: "#e4113c" }}>out</span></span>
          </div>
          <p style={{ color: "#8e8e99", maxWidth: 320, margin: "14px auto 22px", lineHeight: 1.6 }}>Something went wrong loading the app. Please try again.</p>
          <button onClick={reset} style={{ background: "#e4113c", color: "#fff", border: 0, borderRadius: 14, height: 46, padding: "0 22px", fontWeight: 700, fontSize: 15 }}>Try again</button>
        </div>
      </body>
    </html>
  );
}

import { ImageResponse } from "next/og";
import { markSvg } from "@/components/brand/mark";
import { cachedEvent } from "@/lib/cache";
import { datesLabel, timeLabel, rs } from "@/lib/event-format";
import { cityName } from "@/lib/cities";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Event on SyncOut";

/** Share card for WhatsApp/Instagram/Google — social apps don't render SVG posters. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const ev = await cachedEvent((await params).slug);
  const title = ev?.title ?? "Events on SyncOut";
  const from = ev ? ev.tiers.filter((t) => t.isActive).map((t) => t.price) : [];
  const sub = ev ? `${ev.venueName} · ${cityName(ev.citySlug)}` : "Delhi · Gurugram · Noida";
  const when = ev ? `${datesLabel(ev)} · ${timeLabel(ev)}` : "Navratri 2026";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          color: "white",
          background: "linear-gradient(135deg, #2a0845 0%, #a3165b 55%, #ff7a00 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34, fontWeight: 800 }}>
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(markSvg({ size: 64 }))}`} width={64} height={32} style={{ marginRight: 12 }} />sync<span style={{ color: "#f2c14e" }}>out</span>
          <span style={{ marginLeft: 20, fontSize: 22, padding: "6px 16px", borderRadius: 999, background: "rgba(0,0,0,.28)" }}>Dandiya · Navratri 2026</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: title.length > 40 ? 58 : 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 30, opacity: 0.9 }}>{sub}</div>
          <div style={{ marginTop: 10, display: "flex", fontSize: 30 }}>
            <span>{when}</span>
            {from.length > 0 && <span style={{ marginLeft: 24, color: "#f2c14e", fontWeight: 700 }}>from {rs(Math.min(...from))}</span>}
          </div>
        </div>
      </div>
    ),
    size
  );
}

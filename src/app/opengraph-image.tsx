import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "SyncOut — guestlists and Dandiya nights in Delhi NCR";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          color: "white",
          background: "radial-gradient(circle at 80% 20%, #5c0b1f 0%, #08080a 55%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: -3 }}>
          Sync<span style={{ color: "#e4113c" }}>Out</span>
        </div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 40, maxWidth: 950, lineHeight: 1.2 }}>
          {"Guestlists at Delhi NCR's best clubs — and Dandiya nights for Navratri 2026."}
        </div>
        <div style={{ marginTop: 36, display: "flex", fontSize: 28, color: "#f2c14e" }}>Delhi · Gurugram · Noida</div>
      </div>
    ),
    size
  );
}

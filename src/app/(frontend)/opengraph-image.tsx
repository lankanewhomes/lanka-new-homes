import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share-preview image for every page that doesn't set its own
// openGraph.images (project/developer/profile pages already do, from their
// own real photos — this only ever shows for the homepage and static pages
// like /about, /pricing, /for-developers).
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
          padding: "80px",
          background: "#24221e",
          color: "#f7f5f1",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 22, height: 22, background: "#f47b36" }} />
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Lanka<span style={{ color: "#f47b36" }}>New</span>Homes
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 62, fontWeight: 700, marginTop: 48, lineHeight: 1.15, maxWidth: 920 }}>
          New Homes in Sri Lanka
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#c9c5bc", marginTop: 22, maxWidth: 820 }}>
          Browse condominiums, apartments, villas, and land projects direct from developers.
        </div>
      </div>
    ),
    { ...size },
  );
}

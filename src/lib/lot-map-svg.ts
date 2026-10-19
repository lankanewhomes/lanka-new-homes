import type { LandPlot, SiteMapLandmark } from "@/types";

// The numbered block plan (TEST feature, owner 2026-10-19), drawn in the style of a developer's printed block plan: pale green lots, a round
// dark-green badge with the lot number and the size underneath, grey roads with their widths, trees. The badge colour carries the live status.
// Shared by the hero image (static SVG data URL) and the interactive map in land-plots-grid.tsx (which draws the lots itself so they can be clicked).

export const LOT_FILL: Record<string, string> = { Available: "#cfe6d3", Reserved: "#cfe6d3", Sold: "#e2e1dc" };
export const LOT_STROKE = "#a9cdb0";
export const BADGE_FILL: Record<string, string> = { Available: "#14532d", Reserved: "#b7791f", Sold: "#9a9992" };
export const BADGE_TEXT: Record<string, string> = { Available: "#a7f070", Reserved: "#ffffff", Sold: "#ffffff" };
const LANDMARK_FILL: Record<string, string> = { clubhouse: "#e8dff5", pool: "#bfe3f6", "model-home": "#ffd9c2", park: "#dff1d4", gate: "#cfd3dc", road: "#9d9d9d" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function centroid(points: string): [number, number] {
  const pts = points.trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
  return [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
}

export const lotNumber = (plot: LandPlot) => plot.name.replace(/^\s*lots?\s*/i, "").trim();
export const sizeLabel = (plot: LandPlot) => (plot.sizePerches > 0 ? `${Number.isInteger(plot.sizePerches) ? plot.sizePerches : plot.sizePerches}P` : "");

function tree(x: number, y: number): string {
  return `<g><circle cx="${x}" cy="${y}" r="17" fill="#2e7d32"/><circle cx="${x - 11}" cy="${y + 8}" r="13" fill="#3f9142"/><circle cx="${x + 10}" cy="${y + 9}" r="12" fill="#58a45a"/><circle cx="${x + 2}" cy="${y - 7}" r="10" fill="#6bb86c"/></g>`;
}

/** Everything except the lots: ground, roads with their labels, clubhouse / pool / model home, trees and the logo. Returns SVG markup. */
export function lotMapBase(landmarks: SiteMapLandmark[], title: string, subtitle: string): string {
  const out: string[] = [`<rect x="0" y="-40" width="1000" height="750" fill="#ffffff"/>`];
  for (const l of landmarks) {
    if (l.kind === "tree") continue;
    const [cx, cy] = centroid(l.shape);
    out.push(`<polygon points="${l.shape}" fill="${LANDMARK_FILL[l.kind]}" stroke="${l.kind === "road" ? "none" : "#b9b5aa"}" stroke-width="1.5"/>`);
    if (l.label) {
      const rot = l.angle ? ` transform="rotate(${l.angle} ${cx} ${cy})"` : "";
      out.push(`<text x="${cx}" y="${cy}"${rot} text-anchor="middle" dominant-baseline="middle" font-size="${l.kind === "road" ? 14 : 15}" font-weight="${l.kind === "road" ? 500 : 700}" letter-spacing="${l.kind === "road" ? 1 : 0}" fill="${l.kind === "road" ? "#2f2f2f" : "#3b3a36"}">${esc(l.label.toUpperCase() === l.label || l.kind !== "road" ? l.label : l.label.toUpperCase())}</text>`);
    }
  }
  for (const l of landmarks) if (l.kind === "tree") { const [x, y] = l.shape.split(",").map(Number); out.push(tree(x, y)); }
  out.push(`<text x="30" y="34" font-family="Georgia, 'Times New Roman', serif" font-size="30" font-weight="700" letter-spacing="2" fill="#1c1c20">${esc(title.toUpperCase())}</text><line x1="30" y1="46" x2="330" y2="46" stroke="#1c1c20" stroke-width="1.5"/><text x="30" y="64" font-size="12" letter-spacing="6" fill="#1c1c20">${esc(subtitle.toUpperCase())}</text>`);
  return out.join("");
}

function lotMarkup(plot: LandPlot): string {
  const status = plot.status ?? "Available";
  const [cx, cy] = centroid(plot.shape as string);
  return `<polygon points="${plot.shape}" fill="${LOT_FILL[status]}" stroke="${LOT_STROKE}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy - 8}" r="16" fill="${BADGE_FILL[status]}"/><text x="${cx}" y="${cy - 7}" text-anchor="middle" dominant-baseline="middle" font-size="17" font-weight="700" fill="${BADGE_TEXT[status]}">${esc(lotNumber(plot))}</text><text x="${cx}" y="${cy + 20}" text-anchor="middle" dominant-baseline="middle" font-size="14" font-weight="600" fill="#1c1c20">${esc(sizeLabel(plot))}</text>`;
}

/** A static picture of the whole plan, with a legend strip on top. */
export function lotMapSvg(plots: LandPlot[], landmarks: SiteMapLandmark[], title: string, subtitle = "Block plan"): string {
  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -40 1000 750" font-family="Arial, Helvetica, sans-serif">`, lotMapBase(landmarks, title, subtitle)];
  for (const p of plots) if (p.shape) parts.push(lotMarkup(p));
  parts.push(`<rect x="0" y="-40" width="1000" height="40" fill="#f4f1ea"/><text x="20" y="-20" dominant-baseline="middle" font-size="15" font-weight="700" fill="#1c1c20">${esc(title)}: block plan</text>`);
  let x = 620;
  for (const status of ["Available", "Reserved", "Sold"] as const) {
    parts.push(`<circle cx="${x}" cy="-20" r="8" fill="${BADGE_FILL[status]}"/><text x="${x + 14}" y="-20" dominant-baseline="middle" font-size="13" fill="#1c1c20">${status}</text>`);
    x += 125;
  }
  parts.push("</svg>");
  return parts.join("");
}

export const lotMapDataUrl = (plots: LandPlot[], landmarks: SiteMapLandmark[], title: string, subtitle?: string) => `data:image/svg+xml;utf8,${encodeURIComponent(lotMapSvg(plots, landmarks, title, subtitle))}`;

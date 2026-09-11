import type { Project } from "@/types";
import { formatLkr } from "@/lib/format";

// Default caption for a listing's social post — built only from fields the
// developer published (no adjectives we invented). The owner can edit the
// result in the Social tab before posting; this just saves the typing.

const SITE = "lankanewhomes.com";

function tag(s: string) {
  const t = s.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");
  return t ? `#${t}` : "";
}

export function bedroomsLine(project: Project): string | undefined {
  const beds = project.floorPlans.map((p) => p.bedrooms).filter((b) => b > 0);
  if (beds.length) {
    const lo = Math.min(...beds), hi = Math.max(...beds);
    return lo === hi ? `${lo} bedroom` : `${lo}–${hi} bedroom`;
  }
  return typeof project.bedrooms === "string" && project.bedrooms !== "-" ? `${project.bedrooms} bedroom` : undefined;
}

export function typeLine(project: Project): string | undefined {
  const beds = bedroomsLine(project);
  const type = project.type && project.type !== "-" ? project.type.toLowerCase() : undefined;
  if (beds && type) return `${beds} ${type}`;
  return beds ?? (type ? type[0].toUpperCase() + type.slice(1) : undefined);
}

export function priceLine(project: Project): string | undefined {
  if (project.startingPriceLkr > 0) return `From ${formatLkr(project.startingPriceLkr)}`;
  return project.priceRange && project.priceRange !== "-" ? project.priceRange : undefined;
}

export function buildCaption(project: Project): string {
  const lines: string[] = [];
  // Listing names already carry the city ("Viva La Vida - Kottawa") — don't repeat it.
  const nameHasCity = Boolean(project.city) && project.name.toLowerCase().includes(project.city.toLowerCase());
  lines.push(`${project.name}${project.city && !nameHasCity ? ` — ${project.city}` : ""}`);
  const t = typeLine(project), p = priceLine(project);
  if (t || p) lines.push([t, p ? p.replace(/^From /, "from ") : undefined].filter(Boolean).join(" · ").replace(/^./, (c) => c.toUpperCase()));
  const amenities = (project.amenities ?? []).map((a) => a.name).slice(0, 6);
  if (amenities.length) lines.push(amenities.join(" · "));
  if (project.developerName) lines.push(`By ${project.developerName}`);
  lines.push("");
  lines.push(`Floor plans, pricing & brochure → ${SITE}/projects/${project.slug}`);
  lines.push("");
  const tags = ["#LankaNewHomes", "#SriLankaRealEstate", "#NewHomes", project.city ? tag(project.city) : "", project.type ? tag(project.type) : "", project.developerName ? tag(project.developerName) : ""].filter(Boolean);
  lines.push(Array.from(new Set(tags)).join(" "));
  return lines.join("\n");
}

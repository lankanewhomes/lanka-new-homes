import type { Project } from "@/types";

// The few fields Lanka360 (the 3D map explorer) reads per project — sent to the browser instead of the
// full records, which would add megabytes to the page.
export type Lanka360Project = {
  slug: string;
  name: string;
  city: string;
  location: string;
  lat: number;
  lng: number;
  price: number;
  bedrooms: string;
  bathrooms: string;
  parking: number | null;
  type: string;
  status: string;
  statusLabel: string;
  heroImage: string;
  developerName: string;
  floorArea: string;
  isFeatured: boolean;
};

function statusLabel(project: Project): string {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return "Preconstruction";
  if (project.isMoveInNow) return "Move In Now";
  if (project.completionYear >= new Date().getFullYear()) return `Move In ${project.completionYear}`;
  return project.status;
}

export function toLanka360Project(project: Project): Lanka360Project | null {
  const lat = project.coordinates?.lat;
  const lng = project.coordinates?.lng;
  // No map position = nothing to show on a map.
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const parking = project.floorPlans?.map((plan) => plan.parkingSpaces).filter((n): n is number => typeof n === "number" && n > 0) ?? [];
  return {
    slug: project.slug,
    name: project.name,
    city: project.city || project.location || "Sri Lanka",
    location: project.location || project.city || "",
    lat,
    lng,
    price: project.startingPriceLkr > 0 ? project.startingPriceLkr : 0,
    bedrooms: project.bedrooms && project.bedrooms !== "-" ? project.bedrooms : "",
    bathrooms: project.bathrooms && project.bathrooms !== "-" ? project.bathrooms : "",
    parking: parking.length ? Math.max(...parking) : null,
    type: project.type,
    status: project.status,
    statusLabel: statusLabel(project),
    heroImage: project.heroImage,
    developerName: project.developerName,
    floorArea: project.floorAreaRange && project.floorAreaRange !== "-" ? project.floorAreaRange : "",
    isFeatured: Boolean(project.isFeatured),
  };
}

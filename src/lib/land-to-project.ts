import type { FloorPlan, Land, Project, ProjectStatus } from "@/types";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function landStatusToProjectStatus(status: Land["status"]): ProjectStatus {
  if (status === "Sold") return "Nearly Sold Out";
  if (status === "Reserved") return "Under Construction";
  return "Now Selling";
}

function formatPerchPriceRange(min?: number, max?: number): string {
  if (min && max && min !== max) return `${min.toLocaleString()} - ${max.toLocaleString()} per perch`;
  if (min || max) return `${(min ?? max ?? 0).toLocaleString()} per perch`;
  return "";
}

// Design stays identical to the project detail page (ProjectHero, stats
// chips, overview, details table, pricing, key features, amenities, floor
// plans, neighborhood, contact card) — only the data source changes. This
// adapter maps a `Land` record onto the `Project` shape those shared
// components expect, filling fields Land doesn't have with safe,
// non-misleading defaults ("-", 0, empty arrays) rather than fabricated
// values. Shared by the land detail page and the land plot detail page.
export function landToProjectShape(land: Land): Project {
  const plotSlugCounts = new Map<string, number>();
  const floorPlans: FloorPlan[] = (land.plots ?? []).map((plot) => {
    const base = toSlug(plot.name) || plot.id;
    const count = plotSlugCounts.get(base) ?? 0;
    plotSlugCounts.set(base, count + 1);

    return {
      id: plot.id,
      slug: count === 0 ? base : `${base}-${count + 1}`,
      planName: plot.name,
      bedrooms: 0,
      bathrooms: 0,
      floorAreaSqFt: plot.sizePerches,
      startingPriceLkr: plot.priceLkr,
      image: land.heroImage,
      availability: plot.status === "Available" ? "Available" : plot.status === "Sold" ? "Sold Out" : "Limited",
    };
  });

  return {
    slug: land.slug,
    name: land.title,
    developerSlug: land.sellerSlug ?? "",
    developerName: land.sellerName,
    location: land.location,
    district: land.district,
    city: land.city,
    province: land.province,
    neighborhood: land.city,
    type: land.landUse.join(" & "),
    status: landStatusToProjectStatus(land.status),
    isFeatured: land.isFeatured,
    launchDate: "",
    completionYear: 0,
    constructionStatus: "",
    startingPriceLkr: land.priceLkr > 0 ? land.priceLkr : (land.pricePerPerchLkrMin ?? 0),
    priceRange: land.priceLkr > 0 ? land.priceLkr.toLocaleString() : formatPerchPriceRange(land.pricePerPerchLkrMin, land.pricePerPerchLkrMax),
    bedrooms: "-",
    bathrooms: "-",
    floorAreaRange: land.landSizePerches > 0 ? `${land.landSizePerches} perches` : "-",
    units: floorPlans.length,
    floors: 0,
    parking: "-",
    security: "-",
    ownership: land.titleType ?? "-",
    paymentPlan: "",
    paymentPlanItems: land.paymentPlanItems,
    road: land.roadAccess,
    electricity: land.electricity,
    tapWater: land.water,
    summary: land.summary,
    description: land.description,
    heroImage: land.heroImage,
    gallery: land.gallery,
    brochureUrl: land.brochureUrl,
    amenities: land.amenities ?? [],
    unitFeatures: land.unitFeatures,
    floorPlans,
    nearby: land.nearby,
    coordinates: land.coordinates,
    contact: land.contact,
  };
}

// Land-appropriate "Details" table rows — used by both the land detail page
// and the plot detail page. Deliberately NOT `ProjectNarrativeDetails`
// (Property type/Total units/Developer/SqFt labels, built for a real
// Project): that component read Land's landToProjectShape() fields
// (`units`, `floorAreaRange` as a pre-formatted "10 perches" string, etc.)
// and produced nonsensical rows on the plot page ("Total units: 26",
// "Floor plans: 26" duplicating the same count under two wrong labels,
// "SqFt: 10 perches SqFt" double-unitized) — caught 2026-09-10.
export function buildLandDetailRows(land: Land): { label: string; value: string }[] {
  const plots = land.plots ?? [];
  const totalPlots = plots.length;
  const plotsAvailable = plots.filter((plot) => plot.status === "Available").length;

  return [
    { label: "Land use", value: land.landUse.join(", ") },
    { label: "Land type", value: land.landType },
    { label: "Shape of land", value: land.landShape },
    { label: "Status", value: land.status },
    { label: "Plots", value: totalPlots > 0 ? `${plotsAvailable} available of ${totalPlots} total` : undefined },
    { label: "District", value: land.district },
    { label: "City", value: land.city },
    { label: "Province", value: land.province },
    { label: "Road access", value: land.roadAccess },
    { label: "Road width", value: land.roadWidthFt ? `${land.roadWidthFt} ft` : undefined },
    { label: "Electricity", value: land.electricity },
    { label: "Water", value: land.water },
    { label: "Title / deed", value: land.titleType },
    { label: "Survey plan", value: land.surveyPlanStatus },
    { label: "Seller", value: land.sellerName },
  ].filter((row): row is { label: string; value: string } => Boolean(row.value));
}

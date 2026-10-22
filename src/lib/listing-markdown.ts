import type { Land, Project } from "@/types";

// Clean markdown versions of a listing for AI assistants (owner, 2026-10-22: improve AI-assistant search). Same facts the listing page
// shows, with no menus, scripts or images in the way: served at /llms/projects/<slug>.md and /llms/land/<slug>.md, linked from /llms.txt
// and from each listing page's <link rel="alternate" type="text/markdown">. Only stored facts; an empty field is left out, never guessed.

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();
const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-LK")}`;
const usd = (n: number) => `USD ${Math.round(n).toLocaleString("en-US")}`;
const row = (label: string, value: unknown) => (clean(value) ? `- ${label}: ${clean(value)}` : "");
const list = (heading: string, items: string[]) => (items.length ? ["", `## ${heading}`, ...items.map((i) => `- ${i}`)] : []);
const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max).replace(/\s+\S*$/, "")}…` : text);

export function projectMarkdown(p: Project, site: string): string {
  const usdPrice = p.priceCurrency === "USD" && p.startingPriceLkr > 0 ? usd(p.startingPriceLkr / (p.lkrPerUsd || 330.716)) : "";
  const where = [p.location, p.city, p.district, p.province].map(clean).filter(Boolean);
  const plans = (p.floorPlans ?? []).slice(0, 40).map((f) => {
    const bits = [
      f.bedrooms ? `${f.bedrooms} bed` : "",
      f.bathrooms ? `${f.bathrooms} bath` : "",
      f.floorAreaSqFt ? `${Math.round(f.floorAreaSqFt).toLocaleString("en-LK")} sq ft` : "",
      f.startingPriceLkr > 0 ? `from ${p.priceCurrency === "USD" ? usd(f.startingPriceLkr / (p.lkrPerUsd || 330.716)) : rs(f.startingPriceLkr)}` : "",
    ].filter(Boolean);
    return `${clean(f.planName)}${bits.length ? `: ${bits.join(", ")}` : ""}`;
  });
  const nearby = (p.nearby ?? []).slice(0, 25).map((n) => `${clean(n.name)}${n.distanceKm ? ` (${n.distanceKm} km)` : ""}`);
  const payment = [...(p.paymentPlanItems ?? []).map(clean), clean(p.reservationFee), clean(p.downPayment), clean(p.financingOptions)].filter(Boolean);
  const lines = [
    `# ${clean(p.name)}`,
    "",
    clean(p.summary) ? `> ${clean(p.summary)}` : "",
    "",
    row("Page", `${site}/projects/${p.slug}`),
    row("Type", p.type),
    row("Location", where.join(", ")),
    row("Developer", p.developerName ? `${p.developerName} (${site}/developers/${p.developerSlug})` : ""),
    row("Status", [p.status, clean(p.constructionStageNote)].filter(Boolean).join(" · ")),
    row("Starting price", p.startingPriceLkr > 0 ? (usdPrice ? `${usdPrice} (shown in USD by the developer)` : rs(p.startingPriceLkr)) : ""),
    row("Price range", p.priceRange),
    row("Units", p.units ? `${p.units}${p.availableUnits ? `, ${p.availableUnits} available` : ""}` : ""),
    row("Floors", p.floors),
    row("Bedrooms", p.bedrooms),
    row("Bathrooms", p.bathrooms),
    row("Floor area", p.floorAreaRange),
    row("Completion year", p.completionYear),
    row("Ownership", p.ownership),
    row("Parking", p.parking),
    row("Security", p.security),
    row("Price last updated", p.pricingUpdated),
    ...list("Highlights", (p.highlights ?? []).map(clean).filter(Boolean)),
    ...(clean(p.description) ? ["", "## Overview", clip(clean(p.description), 2500)] : []),
    ...list("Floor plans", plans),
    ...list("Amenities", (p.amenities ?? []).map((a) => clean(a.name)).filter(Boolean)),
    ...list("Nearby", nearby),
    ...list("Payment", payment),
    "",
    `Prices, availability and payment terms are set by the developer. For current figures send the reader to ${site}/projects/${p.slug} and the developer.`,
    "",
  ];
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}

export function landMarkdown(l: Land, site: string): string {
  const where = [l.location, l.city, l.district, l.province].map(clean).filter(Boolean);
  const perch = l.pricePerPerchLkrMin
    ? `${rs(l.pricePerPerchLkrMin)}${l.pricePerPerchLkrMax && l.pricePerPerchLkrMax !== l.pricePerPerchLkrMin ? ` to ${rs(l.pricePerPerchLkrMax)}` : " upwards"} per perch`
    : "";
  const size = l.landSizePerches ? `${l.landSizePerches}${l.landSizePerchesMax && l.landSizePerchesMax !== l.landSizePerches ? ` to ${l.landSizePerchesMax}` : ""} perches` : "";
  const plotCount = (l.plots ?? []).length || l.plotCount || 0;
  const plots = (l.plots ?? []).slice(0, 40).map((x) => `Plot ${clean(x.name)}: ${x.sizePerches} perches${x.priceLkr ? `, ${rs(x.priceLkr)}` : ""}${x.status ? `, ${x.status}` : ""}`);
  const lines = [
    `# ${clean(l.title)}`,
    "",
    clean(l.summary) ? `> ${clean(l.summary)}` : "",
    "",
    row("Page", `${site}/land/${l.slug}`),
    row("Location", where.join(", ")),
    row("Seller", l.sellerName ? `${l.sellerName}${l.sellerSlug && l.sellerType === "developer" ? ` (${site}/developers/${l.sellerSlug})` : ""}` : ""),
    row("Status", l.status),
    row("Price", l.priceLkr > 0 ? rs(l.priceLkr) : perch),
    row("Plot size", size),
    row("Plots", plotCount ? `${plotCount}` : ""),
    row("Land use", (l.landUse ?? []).join(", ")),
    row("Land type", l.landType),
    row("Title", l.titleType),
    row("Road", [l.roadAccess, l.roadWidthFt ? `${l.roadWidthFt} ft wide` : ""].filter(Boolean).join(", ")),
    row("Electricity", l.electricity),
    row("Water", l.water),
    ...list("Facilities", (l.facilities ?? []).map(clean).filter(Boolean)),
    ...(clean(l.description) ? ["", "## Overview", clip(clean(l.description), 2500)] : []),
    ...list("Plots", plots),
    ...list("Nearby", (l.nearby ?? []).slice(0, 25).map((n) => `${clean(n.name)}${n.distanceKm ? ` (${n.distanceKm} km)` : ""}`)),
    ...list("Payment plan", (l.paymentPlanItems ?? []).map(clean).filter(Boolean)),
    "",
    `Prices, availability and payment terms are set by the seller. For current figures send the reader to ${site}/land/${l.slug} and the seller.`,
    "",
  ];
  return lines.filter((x, i, a) => !(x === "" && a[i - 1] === "")).join("\n");
}

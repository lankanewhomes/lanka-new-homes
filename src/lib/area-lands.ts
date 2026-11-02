import type { Land, Neighborhood } from "@/types";

// Land plots that belong to a neighbourhood page: the plot's city is the area, or one comma-separated part of its location is
// ("Hokandara, Colombo"). Whole-part matches only, so "Colombo 02" never picks up a plot in "Colombo 14", and "Galle" never
// picks up "Galle Road". Used by the area page's "Land for sale in <area>" section and its title.

const norm = (value: unknown): string => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function landsInArea(lands: Land[], area: Pick<Neighborhood, "name" | "slug">): Land[] {
  const names = new Set([norm(area.name), norm(area.slug)].filter(Boolean));
  return lands.filter((land) => {
    if (names.has(norm(land.city))) return true;
    return String(land.location ?? "").split(",").some((part) => names.has(norm(part)));
  });
}

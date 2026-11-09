import { projectCategories } from "@/lib/listing-categories";
import type { Land, Project } from "@/types";

// The quick chips under the search boxes (phone pop-up, desktop dropdowns). The list below is the fallback order; the live order comes from
// /api/search/chips, which counts the real listings behind each chip so the ones with the most listings come first and empty ones are hidden
// (owner, 2026-11-09).
export type QuickChip = { label: string; href: string };

export const SEARCH_QUICK_CHIPS: QuickChip[] = [
  { label: "Gated Community Houses", href: "/projects/gated-community-houses-for-sale" },
  { label: "Brand New Houses", href: "/projects/brand-new-houses-for-sale" },
  { label: "Pre-Construction", href: "/projects/pre-construction" },
  { label: "Colombo", href: "/projects/colombo" },
  { label: "Luxury", href: "/projects/luxury" },
  { label: "Branded Residences", href: "/projects/branded-residences" },
  { label: "Villas", href: "/projects/villas" },
  { label: "Beachfront", href: "/projects/beachfront" },
  { label: "Serviced Apartments", href: "/projects/serviced-apartments" },
  { label: "Port City Colombo", href: "/projects/port-city-colombo" },
  { label: "Lands", href: "/land" },
  { label: "Lakefront", href: "/projects/lakefront" },
  { label: "Apartments", href: "/projects?type=Apartments" },
  { label: "Condominiums", href: "/projects?type=Condominium" },
];

const SHOWN = 12;

/** Chips with at least one listing, most listings first (ties keep the fallback order), at most 12. */
export function rankQuickChips(projects: Project[], lands: Land[]): (QuickChip & { count: number })[] {
  const live = projects; // counted the same way the chip's own page lists them
  const categoryCount = (path: string) => {
    const category = Object.values(projectCategories).find((entry) => entry.path === path);
    return category ? live.filter(category.filter).length : 0;
  };
  const count = (chip: QuickChip): number => {
    if (chip.href === "/land") return lands.length;
    if (chip.href.startsWith("/projects?type=")) return live.filter((project) => project.type === decodeURIComponent(chip.href.split("type=")[1])).length;
    return categoryCount(chip.href);
  };
  return SEARCH_QUICK_CHIPS.map((chip, index) => ({ ...chip, count: count(chip), index }))
    .filter((chip) => chip.count > 0)
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .slice(0, SHOWN)
    .map(({ label, href, count: total }) => ({ label, href, count: total }));
}

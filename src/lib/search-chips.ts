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
  { label: "Port City Colombo", href: "/projects/port-city-colombo" },
  { label: "Lakefront", href: "/projects/lakefront" },
  { label: "Apartments", href: "/projects?type=Apartments" },
  { label: "Condominiums", href: "/projects?type=Condominium" },
  { label: "Houses", href: "/projects?type=House" },
  { label: "Townhouses", href: "/projects?type=Townhouse" },
  { label: "Luxury Villas", href: "/projects?type=Luxury+Villas" },
  { label: "Luxury Apartments in Colombo", href: "/projects/luxury-apartments-for-sale-in-colombo" },
  { label: "Affordable Apartments in Colombo", href: "/projects/cheap-apartments-for-sale-in-colombo" },
  { label: "Brand New Apartments in Colombo", href: "/projects/brand-new-apartments-for-sale-in-colombo" },
  { label: "2 Bedroom Apartments in Colombo", href: "/projects/2-bedroom-apartments-for-sale-in-colombo" },
  { label: "Houses in Colombo", href: "/projects/houses-for-sale-in-colombo" },
  { label: "Houses in Kandy", href: "/projects/houses-for-sale-in-kandy" },
  { label: "Lands", href: "/land" },
];


/** Chips with at least one listing, most listings first (ties keep the fallback order). Lands is always the last chip. */
export function rankQuickChips(projects: Project[], lands: Land[]): (QuickChip & { count: number })[] {
  const live = projects; // counted the same way the chip's own page lists them
  const categoryCount = (path: string) => {
    const category = Object.values(projectCategories).find((entry) => entry.path === path);
    return category ? live.filter(category.filter).length : 0;
  };
  const count = (chip: QuickChip): number => {
    if (chip.href === "/land") return lands.length;
    if (chip.href.startsWith("/projects?type=")) {
      const type = new URLSearchParams(chip.href.split("?")[1]).get("type");
      return live.filter((project) => project.type === type).length;
    }
    return categoryCount(chip.href);
  };
  return SEARCH_QUICK_CHIPS.map((chip, index) => ({ ...chip, count: count(chip), index }))
    .filter((chip) => chip.count > 0)
    .sort((a, b) => (a.href === "/land" ? 1 : 0) - (b.href === "/land" ? 1 : 0) || b.count - a.count || a.index - b.index)
    .map(({ label, href, count: total }) => ({ label, href, count: total }));
}

/** The category chips in the home page hero (owner, 2026-11-09: "you added too many chips"). The hero used to list every category page, so each new
 *  SEO page added a chip; now only these show, in this order. Other category pages stay on the site, in search and in the search chips. */
export const HERO_CHIP_PATHS = [
  "/projects/gated-community-houses-for-sale",
  "/projects/brand-new-houses-for-sale",
  "/projects/pre-construction",
  "/projects/colombo",
  "/projects/luxury",
  "/projects/branded-residences",
  "/projects/villas",
  "/projects/beachfront",
  "/projects/lakefront",
  "/projects/port-city-colombo",
  "/projects?type=House",
  "/projects?type=Apartments",
];

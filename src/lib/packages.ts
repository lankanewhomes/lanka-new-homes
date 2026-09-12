// Single source of truth for the Free/Featured/Premium listing package
// system — every price, ranking boost, and feature gate reads from here.
// Change a price or a feature flag in exactly one place, not scattered
// across the picker UI, the subscription-creation hook, and the ranking
// formula. Pure/Payload-free so it can be imported from collections,
// hooks, and client components alike (same pattern as completeness.ts).
// Prices are placeholder round numbers, same spirit as PlacementPricing's
// own seed data ("adjust freely, nothing else depends on the exact
// numbers") — change them here, nowhere else.
import { formatLkr } from "@/lib/format";

export type PackageTier = "free" | "featured" | "premium";

export type PackageDefinition = {
  tier: PackageTier;
  name: string;
  /** Monthly price. 0 for Free. */
  price: number;
  currency: "LKR";
  /** Added into final_score (project-scoring.ts) — search/homepage priority. */
  rankingBoost: number;
  /** Sets Projects.featured + the existing .badge-featured pill and homepage "Featured listings" shelf. */
  featured: boolean;
  /** Shows the .badge-premium pill in addition to Featured. */
  premiumBadge: boolean;
  analyticsLevel: "none" | "basic" | "advanced";
  weeklyReports: boolean;
  /** One-line bullets shown on the package picker card. */
  features: string[];
};

export const PACKAGES: Record<PackageTier, PackageDefinition> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    currency: "LKR",
    rankingBoost: 0,
    featured: false,
    premiumBadge: false,
    analyticsLevel: "none",
    weeklyReports: false,
    features: [
      "Full project listing & page",
      "Photos, videos, floor plans, brochure",
      "Standard search placement",
      "Buyer inquiries",
      "Basic lead information",
    ],
  },
  featured: {
    tier: "featured",
    name: "Featured",
    price: 25000,
    currency: "LKR",
    rankingBoost: 15,
    featured: true,
    premiumBadge: false,
    analyticsLevel: "basic",
    weeklyReports: true,
    features: [
      "Everything in Free",
      "Featured badge",
      "Higher search placement",
      "Category/location promotion",
      "Limited homepage exposure",
      "Lead dashboard",
      "Basic project analytics",
      "Weekly performance report",
    ],
  },
  premium: {
    tier: "premium",
    name: "Premium",
    price: 50000,
    currency: "LKR",
    rankingBoost: 35,
    featured: true,
    premiumBadge: true,
    analyticsLevel: "advanced",
    weeklyReports: true,
    features: [
      "Everything in Featured",
      "Priority search placement",
      "Stronger homepage exposure",
      "Advanced project analytics",
      "Buyer location analytics",
      "Lead trends",
      "Social promotion capability",
      "Premium visibility",
    ],
  },
};

export const PACKAGE_LIST: PackageDefinition[] = [PACKAGES.free, PACKAGES.featured, PACKAGES.premium];

export function getPackage(tier: PackageTier | string | null | undefined): PackageDefinition {
  if (tier === "featured" || tier === "premium") return PACKAGES[tier];
  return PACKAGES.free;
}

export function formatPackagePrice(pkg: PackageDefinition): string {
  return pkg.price === 0 ? "Free" : `${formatLkr(pkg.price)}/month`;
}

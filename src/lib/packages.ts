// Single source of truth for the 5-tier listing package system — every
// price, ranking boost, and feature gate reads from here. Change a price or
// feature gate in exactly one place, not scattered across the picker UI,
// the subscription-creation hook, and the ranking formula. Pure/Payload-free
// so it can be imported from collections, hooks, and client components
// alike (same pattern as completeness.ts).
//
// Restructured 2026-09-24 (owner) from the old 3-tier Free/Featured/Premium
// model, through an interim 5-tier draft, to this final structure — a
// pricing-strategy review the owner brought back (own reasoning: lead
// tracking has to justify the Featured price or it won't renew; 10 project
// slots on Developer Pro was capacity most Sri Lankan developers would
// never use; "search priority" needed concrete language instead of vague
// tiers; the 9 always-✓ rows should collapse into one sentence). No live
// Subscriptions existed when this was restructured (checked before
// touching the schema), so no billing-data migration was needed. Prices
// are real, owner-provided figures — not placeholders.
import { formatLkr } from "@/lib/format";

export type PackageTier = "free" | "featured" | "featured-plus" | "developer-pro" | "campaign";

export type PackageDefinition = {
  tier: PackageTier;
  name: string;
  /** Monthly price in LKR. For `campaign`, this is only the STARTING price — see `customPricing`. */
  price: number;
  /** campaign only: the real amount is negotiated per deal and entered by hand on the Subscription — never auto-snapshotted from `price` the way every other tier is (see Subscriptions.ts beforeChange). */
  customPricing?: boolean;
  currency: "LKR";

  // ---- Fields real app logic reads (change these and behavior changes) ----
  /** Added into final_score (project-scoring.ts) — search/homepage priority. Placeholder scale, adjust freely. */
  rankingBoost: number;
  /** How many of the developer's own projects can be marked Featured under this tier (before any extra slots — see `extraFeaturedSlotPrice`). Enforced on Developers.featuredProjectIds (see Developers.ts's beforeChange validation) together with any purchased extra slots. */
  featuredProjectLimit: number | "custom";
  /**
   * À la carte price (LKR/month) for ONE additional featured slot beyond
   * `featuredProjectLimit` — `null` where extras aren't sellable (Free has
   * no base plan to extend; Campaign's scope is custom/negotiated, not
   * à la carte). Tracked on the developer's Subscription
   * (`extra_featured_slots`), billed alongside the base plan price.
   */
  extraFeaturedSlotPrice: number | null;
  /**
   * Hard cap on how many extra slots can be bought on top of
   * `featuredProjectLimit` — `null` means no hard cap (Developer Pro).
   * Featured has no hard cap either, but its per-extra price is
   * deliberately high enough that 2+ extras costs more than just
   * upgrading to Featured Plus — the owner's own "keeps the upgrade path
   * clean" design intent (2026-09-24), enforced by price rather than a
   * cap for that one tier.
   */
  extraFeaturedSlotCap: number | null;
  /** Sets Projects.featured + the .badge-featured pill and homepage "Featured listings" shelf eligibility. */
  featured: boolean;
  /** Developer Pro ("Priority slot") and Campaign ("Fixed premium slot") get an automatic homepage hero slide while their plan is active; plain Featured/Featured Plus don't. Built 2026-09-24 (hooks/sync-developer-plan.ts's syncHeroSlideFromDeveloper) — uses the FIRST project in the developer's featuredProjectIds as the representative one (a judgment call, since there's no separate "pick your hero slide project" control). Homepage hero slots are capped at 5 and rotate randomly, weighted by plan (see hero-ad-store.ts's getActiveHeroAds / planRotationWeight below) once more than 5 are eligible at once. */
  premiumHeroSlide: boolean;
  /** Gates the analytics UI (ListingAnalyticsPanel) and the weekly email digest's deeper sections. "none" = only the raw Views/Inquiries counts every listing already gets (the universal "basic analytics" bullet); "basic" = Lead & call counts (inquiry rate, avg. time on page, lead status breakdown) — Featured/Featured Plus's proof-of-ROI feature; "advanced" = + Detailed lead tracking and buyer-location/traffic/trend analytics — Developer Pro/Campaign only. */
  leadAnalytics: "none" | "basic" | "advanced";
  /** Gates the weekly performance-report email (analytics-digest.ts / project-package-digest.ts). */
  weeklyReports: boolean;

  // ---- Display-only fields (comparison table + admin picker copy; nothing else reads these) ----
  /** Exact per-tier copy for the "Search placement" row — deliberately concrete rather than vague ("Above free" / "Top of featured"), and never promises a numeric rank, since placements rotate among featured developers. */
  searchPlacementLabel: string;
  /** Exact per-tier copy for the "Homepage rotation" row. `false` renders as "—", `true` as a plain check. */
  homepageRotationLabel: string | boolean;
  /** Shows the orange Featured badge pill on the project card/page. */
  featuredBadge: boolean;
  /** NOT YET BUILT — a dedicated homepage/company-page spotlight. Recorded as a planned entitlement so it isn't forgotten, not a working feature. */
  developerSpotlight: boolean;
  /** NOT YET BUILT (no newsletter system, no à la carte add-on purchase flow exists today). "addon" = purchasable separately once that exists; "quarterly" = one included per quarter; "included" = bundled into Campaign. */
  newsletterSocialPromotion: "addon" | "quarterly" | "included";
  /** NOT YET BUILT — a custom marketing push arranged directly with the team. Campaign only. */
  dedicatedCampaign: boolean;
  /** Short bullets shown on the admin package picker and Billing overview. */
  features: string[];
};

export const PACKAGES: Record<PackageTier, PackageDefinition> = {
  free: {
    tier: "free",
    name: "Free",
    price: 0,
    currency: "LKR",
    rankingBoost: 0,
    featuredProjectLimit: 0,
    extraFeaturedSlotPrice: null,
    extraFeaturedSlotCap: null,
    featured: false,
    premiumHeroSlide: false,
    leadAnalytics: "none",
    weeklyReports: false,
    searchPlacementLabel: "Standard",
    homepageRotationLabel: false,
    featuredBadge: false,
    developerSpotlight: false,
    newsletterSocialPromotion: "addon",
    dedicatedCampaign: false,
    features: ["Unlimited project listings", "Full project page, photos, floor plans & brochure", "Buyer enquiries", "Basic analytics (views & enquiry counts)"],
  },
  featured: {
    tier: "featured",
    name: "Featured",
    price: 25000,
    currency: "LKR",
    rankingBoost: 15,
    featuredProjectLimit: 1,
    extraFeaturedSlotPrice: 20000,
    extraFeaturedSlotCap: null,
    featured: true,
    premiumHeroSlide: false,
    leadAnalytics: "basic",
    weeklyReports: true,
    searchPlacementLabel: "Above free",
    homepageRotationLabel: true,
    featuredBadge: true,
    developerSpotlight: false,
    newsletterSocialPromotion: "addon",
    dedicatedCampaign: false,
    features: ["Everything in Free", "Promote 1 project", "Featured badge", "Search placement above Free listings", "Lead & call counts", "Weekly performance report"],
  },
  "featured-plus": {
    tier: "featured-plus",
    name: "Featured Plus",
    price: 50000,
    currency: "LKR",
    rankingBoost: 20,
    featuredProjectLimit: 3,
    extraFeaturedSlotPrice: 15000,
    extraFeaturedSlotCap: 2,
    featured: true,
    premiumHeroSlide: false,
    leadAnalytics: "basic",
    weeklyReports: true,
    searchPlacementLabel: "Above free",
    homepageRotationLabel: true,
    featuredBadge: true,
    developerSpotlight: false,
    newsletterSocialPromotion: "addon",
    dedicatedCampaign: false,
    features: ["Everything in Free", "Promote up to 3 projects", "Featured badge", "Search placement above Free listings", "Lead & call counts", "Weekly performance report"],
  },
  "developer-pro": {
    tier: "developer-pro",
    name: "Developer Pro",
    price: 100000,
    currency: "LKR",
    rankingBoost: 30,
    featuredProjectLimit: 5,
    extraFeaturedSlotPrice: 12000,
    extraFeaturedSlotCap: null,
    featured: true,
    premiumHeroSlide: true,
    leadAnalytics: "advanced",
    weeklyReports: true,
    searchPlacementLabel: "Top of featured",
    homepageRotationLabel: "Priority slot",
    featuredBadge: true,
    developerSpotlight: true,
    newsletterSocialPromotion: "quarterly",
    dedicatedCampaign: false,
    features: ["Everything in Featured Plus", "Promote up to 5 projects", "Top-of-featured search placement", "Priority homepage slot", "Detailed lead tracking & advanced analytics", "Developer spotlight", "1 newsletter/social push per quarter"],
  },
  campaign: {
    tier: "campaign",
    name: "Campaign",
    price: 150000,
    customPricing: true,
    currency: "LKR",
    rankingBoost: 45,
    featuredProjectLimit: "custom",
    extraFeaturedSlotPrice: null,
    extraFeaturedSlotCap: null,
    featured: true,
    premiumHeroSlide: true,
    leadAnalytics: "advanced",
    weeklyReports: true,
    searchPlacementLabel: "Top",
    homepageRotationLabel: "Fixed premium slot",
    featuredBadge: true,
    developerSpotlight: true,
    newsletterSocialPromotion: "included",
    dedicatedCampaign: true,
    features: ["Everything in Developer Pro", "Major homepage/site-wide marketing campaign", "Newsletter & social media promotion included", "Dedicated campaign, arranged directly with our team"],
  },
};

export const PACKAGE_LIST: PackageDefinition[] = [
  PACKAGES.free,
  PACKAGES.featured,
  PACKAGES["featured-plus"],
  PACKAGES["developer-pro"],
  PACKAGES.campaign,
];

export function getPackage(tier: PackageTier | string | null | undefined): PackageDefinition {
  const found = PACKAGE_LIST.find((p) => p.tier === tier);
  return found ?? PACKAGES.free;
}

/**
 * How many projects a developer can currently mark Featured — the plan's
 * base `featuredProjectLimit` plus any purchased `extraSlots`, clamped to
 * `extraFeaturedSlotCap` where one exists. Returns "custom" unchanged for
 * Campaign (extras don't apply — its scope is negotiated). Used to
 * validate `Developers.featuredProjectIds` (see Developers.ts) and to
 * cap the extra-slot purchase UI.
 */
export function maxFeaturedProjects(tier: PackageTier | string | null | undefined, extraSlots: number): number | "custom" {
  const pkg = getPackage(tier);
  if (pkg.featuredProjectLimit === "custom") return "custom";
  if (pkg.extraFeaturedSlotPrice == null) return pkg.featuredProjectLimit;
  const cappedExtras = pkg.extraFeaturedSlotCap != null ? Math.min(extraSlots, pkg.extraFeaturedSlotCap) : extraSlots;
  return pkg.featuredProjectLimit + Math.max(0, cappedExtras);
}

/**
 * Any active paid tier — "Verified" badge eligibility site-wide. Fixes a
 * regression from the 2026-09-24 5-tier restructure: several call sites
 * still literally checked `package === "featured" || package === "premium"`,
 * a value from the OLD 3-tier model that no longer exists in PackageTier,
 * so Verified silently stopped being able to show at all. Use this instead
 * of a hardcoded tier list anywhere "is this project on any paid package"
 * is the actual question.
 */
export function isPaidPackageTier(tier: PackageTier | string | null | undefined): boolean {
  return getPackage(tier).tier !== "free";
}

/**
 * The two tiers with the strongest homepage exposure (Developer Pro,
 * Campaign) — shows the distinguished `.badge-premium` pill instead of the
 * plain `.badge-featured` one. Same regression as `isPaidPackageTier`: this
 * replaces a hardcoded `package === "premium"` check for the old
 * single top tier, which can never match a real PackageTier anymore.
 */
export function hasPremiumStyleBadge(tier: PackageTier | string | null | undefined): boolean {
  const resolved = getPackage(tier).tier;
  return resolved === "developer-pro" || resolved === "campaign";
}

/**
 * Simple 1–4 weight scale for randomized homepage rotation (hero slides,
 * the Featured section — see hero-ad-store.ts's getActiveHeroAds) and,
 * later, search/collection-page ranking order — the owner's own scale from
 * the 2026-09-24 build notes: Campaign 4, Developer Pro 3, Featured/
 * Featured Plus 2, Free 1. Deliberately coarser than `rankingBoost` (an
 * additive input into the /projects score formula, already tuned for that
 * use) — this is a weight for weighted-random selection, where the RATIO
 * between tiers matters more than the absolute number.
 */
export function planRotationWeight(tier: PackageTier | string | null | undefined): number {
  switch (getPackage(tier).tier) {
    case "campaign":
      return 4;
    case "developer-pro":
      return 3;
    case "featured":
    case "featured-plus":
      return 2;
    default:
      return 1;
  }
}

export function formatPackagePrice(pkg: PackageDefinition): string {
  if (pkg.price === 0) return "Free";
  const label = `${formatLkr(pkg.price)}/month`;
  return pkg.customPricing ? `From ${label}` : label;
}

/**
 * Just the amount, no "/month" suffix — for layouts (the pricing
 * comparison table) that render the suffix on its own smaller line
 * instead of letting a long "Rs. 100,000/month" string wrap wherever the
 * browser happens to break it (owner report, 2026-09-24: didn't like
 * "Rs." wrapping away from the number).
 */
export function formatPackagePriceAmount(pkg: PackageDefinition): string {
  if (pkg.price === 0) return "Free";
  return pkg.customPricing ? `From ${formatLkr(pkg.price)}` : formatLkr(pkg.price);
}

/**
 * Display-only: annual price if billed yearly at "2 months free" (owner,
 * 2026-09-24) — i.e. 10x the monthly price for 12 months. This is NOT a
 * real billing option yet: Subscriptions has no billing-interval field and
 * always bills monthly — this only exists so the public pricing page can
 * show the incentive. Wire up an actual annual cycle before promising it
 * at checkout.
 */
export function formatAnnualPrice(pkg: PackageDefinition): string | null {
  if (pkg.price === 0 || pkg.customPricing) return null;
  return `${formatLkr(pkg.price * 10)}/year`;
}

export const PACKAGE_ANNUAL_BILLING_NOTE = "Annual billing: 2 months free.";

/**
 * Real billing cycles (owner, 2026-09-25 — "real annual/quarterly
 * billing," replacing what `formatAnnualPrice` above used to be: display
 * copy only). Multiplies the monthly amount before any founding-developer
 * discount is applied — see `FOUNDING_DEVELOPER_DISCOUNT` below.
 * `quarterly` has no separate discount; `annual` is exactly the "2 months
 * free" already promised (10x monthly for 12 months of coverage), now a
 * real number instead of just a caption. Campaign is exempt (see
 * `customPricing`) — its amount is never computed, so a billing interval
 * multiplier has nothing to apply to.
 */
export type BillingInterval = "monthly" | "quarterly" | "annual";
export const BILLING_INTERVAL_MULTIPLIERS: Record<BillingInterval, number> = {
  monthly: 1,
  quarterly: 3,
  annual: 10,
};

/**
 * "Founding developer" launch discount (owner's idea, numbers confirmed
 * 2026-09-25: first 10 developers, 40% off). Scoped GLOBALLY (a hard cap
 * on how many developers total can ever hold it — not a per-account time
 * window), and once earned it's permanent: it applies to every
 * subscription that developer ever activates from then on, even through a
 * later cancel/resubscribe cycle, because the slot is spent on THEM, not
 * returned to the pool. Eligibility is decided at the moment a
 * subscription is ACTIVATED (Subscriptions.ts's "becomingActive" hook),
 * not at creation — an abandoned/incomplete request never costs a
 * developer their shot at a slot, since it never got confirmed as real.
 * Never applies to Campaign (customPricing — no computed amount to
 * discount off of).
 */
export const FOUNDING_DEVELOPER_CAP = 10;
export const FOUNDING_DEVELOPER_DISCOUNT = 0.4;

/**
 * À la carte newsletter/social promotion for ONE project — the "Newsletter
 * + social" row's "Add-on" cells (Free/Featured/Featured Plus). Developer
 * Pro gets one included per quarter; Campaign has it bundled — this
 * request flow exists for everyone else. Flat one-off prices, not tied to
 * a tier's monthly price. See AddonRequests.ts — this creates a request an
 * admin fulfills manually (no newsletter system or automated social
 * publishing pipeline exists yet, same "not built" status as the features
 * themselves).
 */
export const ADDON_PRICES = {
  newsletter: 15000,
  social: 20000,
} as const;
export type AddonType = keyof typeof ADDON_PRICES;

/** Owner's exact wording (2026-09-24) — shown once above/below the comparison table instead of repeating 8 always-✓ rows for every tier. */
export const PACKAGE_ALWAYS_INCLUDED =
  "All plans include profile, unlimited projects, photos/videos, floor plans, map, buyer enquiries, verification, and basic analytics.";

// ---- Feature comparison matrix (public /pricing table + admin picker "?" tooltips) ----
// The differentiating rows only — the 8 features every tier includes are
// covered by PACKAGE_ALWAYS_INCLUDED above instead of repeating as rows.
// `values` is keyed by PACKAGE_LIST's order (free, featured, featured-plus,
// developer-pro, campaign) — true/false render as a check/dash, a string
// renders as-is. `notYetBuilt` rows are real, recorded entitlements with no
// working feature behind them yet — the tooltip says so explicitly so a
// developer isn't misled about what they'd actually get today.
export type PackageFeatureValue = boolean | string;

export type PackageFeatureRow = {
  key: string;
  label: string;
  /** Shown behind the "?" info-circle as a bullet list — both the admin/developer-facing Package tab and (for rows like Search placement) an explanation of exactly where on the site it shows up. One short point per bullet, not a paragraph (owner, 2026-09-24). */
  tooltip: string[];
  values: [PackageFeatureValue, PackageFeatureValue, PackageFeatureValue, PackageFeatureValue, PackageFeatureValue];
  /** Real, not-yet-built entitlements get an extra "Planned — not built yet" bullet appended automatically wherever this is rendered — don't repeat that line inside `tooltip` itself. */
  notYetBuilt?: boolean;
};

export const PACKAGE_FEATURE_ROWS: PackageFeatureRow[] = [
  {
    key: "featured-projects",
    label: "Featured projects",
    tooltip: [
      "Marks that many of your own projects as Featured.",
      "Each Featured project gets the Featured badge and higher search/homepage placement.",
      "Pick which projects on the Placements tab in your developer dashboard.",
    ],
    values: [false, "1", "3", "5", "Custom"],
  },
  {
    key: "extra-spots",
    label: "Extra spots",
    tooltip: [
      "Buy additional featured slots beyond your plan's included amount, at your plan's per-extra-slot price.",
      "Works exactly like your included spots — pick any project, swap any time, ends when your plan does.",
    ],
    values: [false, "Rs. 20,000/mo each", "Rs. 15,000/mo each (max 2)", "Rs. 12,000/mo each", "Included"],
  },
  {
    key: "homepage-rotation",
    label: "Homepage rotation",
    tooltip: [
      "Chance to appear in the homepage's Featured projects shelf (capped at 8) and hero banner rotation (capped at 5).",
      "Developer Pro gets a priority slot, Campaign a fixed slot, in the homepage hero banner rotation (the big rotating banner at the top of lankanewhomes.com).",
      "Once there are more eligible projects/developers than slots, which ones show rotates on each page load, weighted by plan — a higher tier appears more often, but never crowds out the others completely.",
    ],
    values: [false, true, true, "Priority slot", "Fixed premium slot"],
  },
  {
    key: "search-placement",
    label: "Search placement",
    tooltip: [
      "Where your project appears in category search results (e.g. lankanewhomes.com/projects/colombo).",
      "Featured and Featured Plus rank above equivalent Free listings.",
      "Developer Pro appears first within that Featured group; Campaign gets top placement overall.",
      "Never a fixed '#1' spot — placements rotate among featured developers.",
    ],
    values: ["Standard", "Above free", "Above free", "Top of featured", "Top"],
  },
  {
    key: "featured-badge",
    label: "Featured badge",
    tooltip: [
      "The orange 'Featured' pill on the project's card in listings and search results.",
      "Also shown on the project page itself.",
    ],
    values: [false, true, true, true, true],
  },
  {
    key: "lead-call-counts",
    label: "Lead & call counts",
    tooltip: [
      "See how many enquiries, WhatsApp clicks, phone calls and email clicks each project receives.",
      "Shown on the project's Analytics tab in /cms.",
      "This is the proof of what your listing is actually producing.",
    ],
    values: [false, true, true, true, true],
  },
  {
    key: "detailed-lead-tracking",
    label: "Detailed lead tracking",
    tooltip: [
      "Breaks those leads down by channel — WhatsApp vs. call vs. email vs. form.",
      "Shows the trend over time, not just a total count.",
    ],
    values: [false, false, false, true, true],
  },
  {
    key: "advanced-analytics",
    label: "Advanced analytics",
    tooltip: [
      "Buyer location — which cities/countries are viewing.",
      "Top traffic source.",
      "A trend chart over time.",
    ],
    values: [false, false, false, true, true],
  },
  {
    key: "developer-spotlight",
    label: "Developer spotlight",
    tooltip: ["A dedicated homepage/company-page feature highlighting your company."],
    values: [false, false, false, true, true],
    notYetBuilt: true,
  },
  {
    key: "newsletter-social",
    label: "Newsletter + social",
    tooltip: [
      "Promotion in an email newsletter to buyers, and a post on LankaNewHomes' own social accounts.",
      "Request it for a specific project from that project's Promotion tab in /cms — Rs. 15,000 for a newsletter feature or Rs. 20,000 for a social push, one per quarter included on Developer Pro, bundled with Campaign.",
      "We write and send/post it by hand once confirmed — there's no automated newsletter or social pipeline yet.",
    ],
    values: ["Add-on", "Add-on", "Add-on", "1/quarter", "Included"],
  },
  {
    key: "dedicated-campaign",
    label: "Dedicated campaign",
    tooltip: [
      "A custom marketing push arranged directly with the LankaNewHomes team.",
      "Campaign only, negotiated per deal — not a self-serve feature.",
    ],
    values: [false, false, false, false, true],
  },
];

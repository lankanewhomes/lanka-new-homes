// ONE place for every price, tier allowance and discount of the paid "Featured" placement system.
// Edit the numbers here; /advertise, the dashboard price calculator and the engine all read this file.
// (Separate from src/lib/packages.ts, which is the older listing-subscription system.)

export type FeaturedTier = "featured" | "premium" | "elite";

export const TIER_ORDER: FeaturedTier[] = ["elite", "premium", "featured"]; // best first
export const TIER_RANK: Record<FeaturedTier, number> = { featured: 1, premium: 2, elite: 3 };

export const TIERS: Record<
  FeaturedTier,
  { name: string; priceLkrPerMonth: number; projectSlots: number; tagline: string; includes: string[]; inherits?: FeaturedTier }
> = {
  featured: {
    name: "Featured",
    priceLkrPerMonth: 25_000,
    projectSlots: 1,
    tagline: "Get seen by buyers browsing your area.",
    includes: [
      "Featured badge + highlighted card",
      "Sponsored card inside search results",
      "Premium map pin (bigger, branded, always visible)",
      "Spot in Similar and Nearby projects",
      "Spot on the thank-you page after an enquiry",
      "Monthly performance report",
    ],
  },
  premium: {
    name: "Premium",
    priceLkrPerMonth: 60_000,
    projectSlots: 3,
    inherits: "featured",
    tagline: "Top of the page where buyers decide.",
    includes: [
      "Everything in Featured",
      "Top 3 pinned on matching location and category pages",
      "Homepage Featured Projects carousel",
      "Photo card in search as buyers type (phone), sponsored suggestion on desktop",
      "Project cards inside matching guides",
      "Pinned on the /developers directory",
      "Developer logo + video on your cards",
    ],
  },
  elite: {
    name: "Elite",
    priceLkrPerMonth: 120_000,
    projectSlots: 6,
    inherits: "premium",
    tagline: "First in every rotation, with no competitors beside you.",
    includes: [
      "Everything in Premium",
      "First in every rotation",
      "Location and category page banner",
      "Card in the Projects menu",
      "Homepage developer logo bar",
      "1 week on the homepage hero every month",
      "Competitor-free project pages (no other developer's featured projects on yours)",
      "1 newsletter feature + 2 social posts a month",
    ],
  },
};

export type AddOnType =
  | "hero-slide"
  | "announcement-bar"
  | "developer-of-month"
  | "new-launch"
  | "city-tile"
  | "sponsored-article"
  | "social-post"
  | "reel"
  | "newsletter"
  | "website-link";

export const ADD_ONS: Record<
  AddOnType,
  { name: string; priceLkr: number; unit: string; description: string; max?: string; durationDays?: number }
> = {
  "hero-slide": { name: "Homepage hero slide", priceLkr: 50_000, unit: "per month", description: "A full-width slide at the top of the homepage.", max: "Max 3 slides at a time", durationDays: 30 },
  "announcement-bar": { name: "Announcement bar", priceLkr: 15_000, unit: "per week", description: "A line of text across the very top of every page.", durationDays: 7 },
  "developer-of-month": { name: "Developer of the Month", priceLkr: 40_000, unit: "per month", description: "Your company profile on the homepage.", max: "One developer per month", durationDays: 30 },
  "new-launch": { name: "New launch spotlight", priceLkr: 25_000, unit: "for 30 days", description: "Your new project in the homepage New Launches strip.", durationDays: 30 },
  "city-tile": { name: "City tile", priceLkr: 20_000, unit: "per month", description: "Your project as the sponsored pick on a homepage city tile.", durationDays: 30 },
  "sponsored-article": { name: "Sponsored article", priceLkr: 35_000, unit: "one-time", description: "A Developer Spotlight article in our guides. We also post it on our Instagram, TikTok and Facebook." }, // owner, 2026-11-21: the article is shared on social too
  "social-post": { name: "Social post", priceLkr: 10_000, unit: "each", description: "A post about your project on our Instagram, TikTok and Facebook." },
  reel: { name: "Reel", priceLkr: 20_000, unit: "each", description: "A short video reel about your project." },
  newsletter: { name: "Newsletter slot", priceLkr: 7_500, unit: "each", description: "A feature in our email newsletter." },
  // Owner, 2026-11-26: a developer who wants their own website on the Featured search cards pays extra. Price confirmed by the owner the same day: Rs 10,000 per month.
  "website-link": { name: "Website link in search", priceLkr: 10_000, unit: "per month", description: "A link to your own website on your Featured cards in search as buyers type.", max: "Needs a Premium or Elite package", durationDays: 30 },
};

export const MAX_HERO_SLIDES = 3;
export const MAX_PINNED_PER_PAGE = 3;
export const INLINE_EVERY = 6; // a sponsored card after every 6th organic result

export const LEAD_PRICE_USD = 25;
export const LEAD_TYPES = ["WhatsApp", "Call", "Brochure download", "Contact form"] as const;
export const LEAD_NOTE = "Invalid leads are refunded.";

// Discount for paying several months at once. Keys are month counts.
export const TERM_DISCOUNTS: { months: number; percent: number }[] = [
  { months: 3, percent: 10 },
  { months: 6, percent: 15 },
  { months: 12, percent: 25 },
];

// 50% off the first 6 months. Does not stack with the term discounts: the customer gets whichever saves more.
export const FOUNDING_PARTNER = { percent: 50, months: 6, label: "Founding Partner" };

export const CONTACT = {
  whatsappDisplay: "+1 647-779-5729",
  whatsappHref: "https://wa.me/16477795729",
  email: "developers@lankanewhomes.com",
};

/** The first placement-level access rule: the lowest tier that unlocks each placement. Add-on placements are not listed (they are booked). */
export type Placement =
  | "home-hero"
  | "home-featured-carousel"
  | "home-new-launches"
  | "home-developer-of-month"
  | "home-logo-bar"
  | "home-city-tiles"
  | "results-top"
  | "results-inline"
  | "results-map-pin"
  | "results-banner"
  | "search-autocomplete"
  | "results-empty"
  | "project-similar"
  | "project-nearby"
  | "thankyou-also-like"
  | "directory-developers"
  | "directory-construction"
  | "directory-land"
  | "guide-inline"
  | "guide-end"
  | "guide-spotlight"
  | "site-announcement"
  | "site-menu-card"
  | "saved-recommended";

export const PLACEMENT_MIN_TIER: Partial<Record<Placement, FeaturedTier>> = {
  "results-inline": "featured",
  "results-map-pin": "featured",
  "results-empty": "featured",
  "project-similar": "featured",
  "project-nearby": "featured",
  "thankyou-also-like": "featured",
  "saved-recommended": "featured",
  "results-top": "premium",
  "home-featured-carousel": "premium",
  "search-autocomplete": "premium",
  "guide-inline": "premium",
  "guide-end": "premium",
  "directory-developers": "premium",
  "directory-construction": "premium",
  "directory-land": "premium",
  "results-banner": "elite",
  "site-menu-card": "elite",
  "home-logo-bar": "elite",
};

export const PLACEMENT_LABEL: Record<Placement, string> = {
  "home-hero": "Homepage hero",
  "home-featured-carousel": "Homepage Featured Projects",
  "home-new-launches": "Homepage New Launches",
  "home-developer-of-month": "Developer of the Month",
  "home-logo-bar": "Homepage logo bar",
  "home-city-tiles": "Homepage city tiles",
  "results-top": "Pinned top results",
  "results-inline": "Sponsored card in results",
  "results-map-pin": "Premium map pin",
  "results-banner": "Location / category banner",
  "search-autocomplete": "Search as buyers type",
  "results-empty": "No-results page",
  "project-similar": "Similar projects",
  "project-nearby": "Nearby projects",
  "thankyou-also-like": "Thank-you page",
  "directory-developers": "/developers directory",
  "directory-construction": "/construction-companies directory",
  "directory-land": "Land for sale page",
  "guide-inline": "Guide cards",
  "guide-end": "End of guide",
  "guide-spotlight": "Developer Spotlight article",
  "site-announcement": "Announcement bar",
  "site-menu-card": "Projects menu card",
  "saved-recommended": "Recommended for you",
};

export function priceWithDiscount(monthlyLkr: number, months: number, foundingPartner = false): { total: number; discountPercent: number; saved: number; label: string | null } {
  const gross = monthlyLkr * months;
  const term = [...TERM_DISCOUNTS].reverse().find((entry) => months >= entry.months)?.percent ?? 0;
  // Founding Partner: 50% off the first 6 months only, averaged over the term. It does not stack with the term discount: whichever saves more.
  const founding = foundingPartner ? (FOUNDING_PARTNER.percent * Math.min(months, FOUNDING_PARTNER.months)) / months : 0;
  const useFounding = founding > term;
  const percent = useFounding ? founding : term;
  const saved = Math.round((gross * percent) / 100);
  return {
    total: gross - saved,
    discountPercent: Math.round(percent * 10) / 10,
    saved,
    label: percent === 0 ? null : useFounding ? FOUNDING_PARTNER.label : `${term}% off for ${months}+ months`,
  };
}

// ============================================================================================================================
// DEMO DATA FOR THE FEATURED PLACEMENTS PREVIEW  -  REMOVE BEFORE LAUNCH
//
// FEATURED_DEMO is the ONE switch. While it is true:
//   * every Featured slot is filled with demo packages and add-ons built from REAL existing projects (nothing is written anywhere),
//   * the whole site answers with "noindex" (X-Robots-Tag header, robots.txt and a meta tag) so the preview can never be indexed,
//   * the dashboard Featured screens run on this data and saving is switched off,
//   * a "DEMO" badge shows on every sponsored slot.
// To launch: set FEATURED_DEMO to false (or delete this file and the imports of it), run the migration
// supabase/migrations/20261121120000_featured_placements.sql, then book real packages in /dashboard/featured.
// ============================================================================================================================
import type { Developer, Project } from "@/types";
import { TIERS, type AddOnType, type FeaturedTier } from "./config";
import type { AddOnBooking, FeaturedPackage, FeaturedState } from "./types";

// Master switches, set at BUILD time (NEXT_PUBLIC_ values are inlined).
// LIVE since 2026-11-21 (owner: "make it live"): real, paid placements are ON by default. The tables exist (migration applied) and are
// empty until a package or add-on is booked in /dashboard/featured, so a slot with no booking renders nothing.
// Kill switch: build with NEXT_PUBLIC_FEATURED_ENABLED=0 to turn every slot off again.
export const FEATURED_DEMO = process.env.NEXT_PUBLIC_FEATURED_DEMO === "1"; // preview build only: demo data + noindex. Never on the live build.
export const FEATURED_ENABLED = FEATURED_DEMO || process.env.NEXT_PUBLIC_FEATURED_ENABLED !== "0";
// The /advertise pricing page is NOT live yet (owner, 2026-11-21: "don't make the advertise page live, keep a preview"). It only
// exists on the preview build. To publish it later, build with NEXT_PUBLIC_ADVERTISE_PUBLIC=1.
export const ADVERTISE_PUBLIC = FEATURED_DEMO || process.env.NEXT_PUBLIC_ADVERTISE_PUBLIC === "1";

type DemoPlan = { developerSlug: string; tier: FeaturedTier; foundingPartner?: boolean };

// Real developers on the site. Tiers are invented for the demo only.
const DEMO_PLAN: DemoPlan[] = [
  { developerSlug: "prime-lands", tier: "elite" },
  { developerSlug: "rush-lanka-group", tier: "elite" },
  { developerSlug: "home-lands-skyline", tier: "premium" },
  { developerSlug: "blue-ocean-group", tier: "premium", foundingPartner: true },
  { developerSlug: "grand-apartments-group", tier: "premium" },
  { developerSlug: "global-housing-and-real-estate", tier: "premium" },
  { developerSlug: "gvr-lanka", tier: "featured" },
  { developerSlug: "odiliya-homes", tier: "featured" },
  { developerSlug: "maison-ceylon", tier: "featured" },
  { developerSlug: "crystal-property-group", tier: "featured", foundingPartner: true },
  { developerSlug: "john-keells-properties", tier: "featured" },
  { developerSlug: "jaysons-realty", tier: "featured" },
];

const isSold = (project: Project) => /sold/i.test(String(project.status));
const usable = (project: Project) => project.isPublished !== false && !isSold(project) && Boolean(project.heroImage) && !project.isLand;

/** Picks up to `count` projects of one developer, spreading across different cities and types so each slot adds something new. */
function pickSpread(projects: Project[], count: number): Project[] {
  const chosen: Project[] = [];
  const seen = new Set<string>();
  const pool = [...projects];
  while (chosen.length < count && pool.length) {
    const index = Math.max(0, pool.findIndex((project) => !seen.has(`${project.city}/${project.type}`)));
    const [project] = pool.splice(index, 1);
    chosen.push(project);
    seen.add(`${project.city}/${project.type}`);
  }
  return chosen;
}

const dayOffset = (base: Date, days: number) => new Date(base.getTime() + days * 86_400_000).toISOString().slice(0, 10);

export function buildDemoState(projects: Project[], developers: Developer[], now = new Date()): FeaturedState {
  const good = projects.filter(usable);
  const byDeveloper = new Map<string, Project[]>();
  for (const project of good) byDeveloper.set(project.developerSlug, [...(byDeveloper.get(project.developerSlug) ?? []), project]);

  // Packages run from 10 days ago to 80 days ahead so they are always "active" while the demo is on.
  const startDate = dayOffset(now, -10);
  const endDate = dayOffset(now, 80);

  const packages: FeaturedPackage[] = [];
  for (const plan of DEMO_PLAN) {
    const own = byDeveloper.get(plan.developerSlug) ?? [];
    if (!own.length) continue;
    const slots = TIERS[plan.tier].projectSlots;
    packages.push({
      id: `demo-${plan.developerSlug}`,
      developerSlug: plan.developerSlug,
      tier: plan.tier,
      startDate,
      endDate,
      slots,
      projectSlugs: pickSpread(own, slots).map((project) => project.slug),
      foundingPartner: plan.foundingPartner,
    });
  }

  const bookings: AddOnBooking[] = [];
  const book = (type: AddOnType, project: Project | undefined, extra: Partial<AddOnBooking> = {}, days = 60) => {
    if (!project) return;
    bookings.push({
      id: `demo-${type}-${bookings.length + 1}`,
      type,
      developerSlug: project.developerSlug,
      projectSlug: project.slug,
      startDate,
      endDate: dayOffset(now, days),
      creative: {
        image: project.heroImage,
        headline: project.name,
        subline: [project.location, project.type].filter(Boolean).join(" · "),
        ctaLabel: "View project",
        ctaHref: `/projects/${project.slug}`,
      },
      ...extra,
    });
  };
  const first = (slug: string) => byDeveloper.get(slug)?.[0];
  const inCity = (city: string, skipDeveloper?: string) =>
    good.find((project) => project.developerSlug !== skipDeveloper && `${project.city} ${project.location} ${project.district}`.toLowerCase().includes(city.toLowerCase()));

  // Hero: 3 slides max. (Elite packages also get one hero week a month; see engine.eliteHeroPackages.)
  book("hero-slide", first("rush-lanka-group"));
  book("hero-slide", first("home-lands-skyline"));
  book("hero-slide", first("blue-ocean-group"));

  // Announcement bar.
  const announce = first("prime-lands");
  if (announce) {
    book("announcement-bar", announce, {
      creative: { image: announce.heroImage, headline: `Now selling: ${announce.name}, ${announce.city || announce.location}`, ctaLabel: "View project", ctaHref: `/projects/${announce.slug}` },
    }, 21);
  }

  // Developer of the Month.
  const dom = developers.find((developer) => developer.slug === "grand-apartments-group") ?? developers.find((developer) => byDeveloper.has(developer.slug));
  if (dom) {
    const project = first(dom.slug);
    if (project) book("developer-of-month", project, { developerSlug: dom.slug, creative: { image: project.heroImage, headline: dom.name, subline: dom.description?.slice(0, 160), ctaLabel: "View developer", ctaHref: `/developers/${dom.slug}` } });
  }

  // New launches: newest "Coming Soon" / "Launching Soon" listings, topped up with the newest "Now Selling".
  const launches = [
    ...good.filter((project) => /coming|launching/i.test(String(project.status))),
    ...[...good].filter((project) => /selling/i.test(String(project.status))).sort((a, b) => String(b.publishedAt ?? b.createdAt ?? "").localeCompare(String(a.publishedAt ?? a.createdAt ?? ""))),
  ];
  const seenDeveloper = new Set<string>();
  for (const project of launches) {
    if (seenDeveloper.has(project.developerSlug) || seenDeveloper.size >= 4) continue;
    seenDeveloper.add(project.developerSlug);
    book("new-launch", project);
  }

  // City tiles: one sponsored project per city.
  for (const city of ["Colombo", "Kandy", "Galle", "Negombo", "Nuwara Eliya"]) {
    const project = inCity(city);
    if (project) book("city-tile", project, { city });
  }

  // Sponsored "Developer Spotlight" article.
  const spotlight = first("home-lands-skyline");
  if (spotlight) {
    book("sponsored-article", spotlight, {
      id: "demo-spotlight-home-lands-skyline",
      creative: {
        image: spotlight.heroImage,
        headline: `Developer Spotlight: ${spotlight.developerName}`,
        subline: `How ${spotlight.developerName} is building around ${spotlight.city || "Colombo"}`,
        ctaLabel: "Read the spotlight",
        ctaHref: "/guides/developer-spotlight/home-lands-skyline",
      },
    }, 365);
  }
  return { packages, bookings, demo: true };
}

/** Plausible, invented numbers for the demo report (never shown outside the demo). */
export function demoReportNumbers(seed: string, placement: string): { impressions: number; clicks: number; leads: number } {
  let h = 2166136261;
  for (const ch of `${seed}:${placement}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const impressions = 400 + (h % 5200);
  const clicks = Math.round(impressions * (0.018 + ((h >>> 8) % 40) / 1000));
  const leads = Math.max(0, Math.round(clicks * (0.04 + ((h >>> 16) % 30) / 1000)));
  return { impressions, clicks, leads };
}


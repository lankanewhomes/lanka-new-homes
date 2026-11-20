import { ListingPageBody, type SponsoredEntry } from "@/components/marketplace/listing-page";
import { buildBreadcrumbJsonLd, buildItemListJsonLd, jsonLdScriptProps, type BreadcrumbEntry } from "@/lib/seo";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { FeaturedSlot } from "@/components/featured/featured-slot";
import { getFeaturedData } from "@/lib/featured/store";
import { activeItems, selectFeatured } from "@/lib/featured/engine";
import { MAX_PINNED_PER_PAGE, TIER_RANK } from "@/lib/featured/config";
import type { SlotContext } from "@/lib/featured/types";
import { slimForHome } from "@/lib/home-slim";
import type { Project } from "@/types";

// The page's place and type, read from the projects it lists: when (nearly) all of them share one city or one type, that is the page's
// location / category, and only featured projects of the same place and type may be pinned or sponsored here.
const baseCity = (city: string) => city.replace(/\s+\d+$/, "").trim();
function dominant(values: string[]): string | undefined {
  if (values.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const value of values) if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [top] = [...counts].sort((a, b) => b[1] - a[1]);
  return top && top[1] / values.length >= 0.7 ? top[0] : undefined;
}
export function inferListingContext(projects: Project[]): SlotContext {
  if (projects.length < 2) return {};
  return { location: dominant(projects.map((project) => baseCity(project.city || ""))), type: dominant(projects.map((project) => project.type || "")) };
}

export async function ProjectListingShell({
  breadcrumbs,
  h1,
  intro,
  projects,
  basePath = "/projects",
  eyebrow = "communities",
  singularEyebrow = "community",
  filterGroups,
  emptyStateText,
  citySectionHeading,
  about,
  featuredContext,
}: {
  breadcrumbs: BreadcrumbEntry[];
  h1: string;
  intro: string;
  projects: Project[];
  relatedPaths: string[];
  basePath?: string;
  eyebrow?: string;
  singularEyebrow?: string;
  filterGroups?: { label: string; options: string[] }[];
  emptyStateText?: string;
  citySectionHeading?: string;
  about?: { title: string; paragraphs: string[] };
  /** Overrides the place/type read from the listed projects. */
  featuredContext?: SlotContext;
}) {
  const itemListJsonLd = buildItemListJsonLd(projects.map((project) => ({ name: project.name, url: `${basePath}/${project.slug}` })));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbs);

  // ---- Featured placements (project listings only; land has its own) ----
  let organic = projects;
  let sponsored: SponsoredEntry[] = [];
  let premiumPinSlugs: string[] = [];
  let banner = null;
  let pinned = null;
  let empty = null;
  if (basePath === "/projects") {
    const ctx = featuredContext ?? inferListingContext(projects);
    const hasContext = Boolean(ctx.location || ctx.type);
    const { state, projects: all, developers } = await getFeaturedData();
    const pinnedItems = selectFeatured(state, all, "results-top", { ...ctx, limit: MAX_PINNED_PER_PAGE });
    const pinnedSlugs = new Set(pinnedItems.map((item) => item.project.slug));
    organic = projects.filter((project) => !pinnedSlugs.has(project.slug)); // organic results keep their normal order
    sponsored = selectFeatured(state, all, "results-inline", { ...ctx, limit: 6 })
      .filter((item) => !pinnedSlugs.has(item.project.slug))
      .map((item) => ({ project: slimForHome(item.project), tier: item.tier, logo: developers.find((d) => d.slug === item.developerSlug)?.logo }));
    const onPage = new Set(projects.map((project) => project.slug));
    premiumPinSlugs = activeItems(state, all, new Date()).filter((item) => onPage.has(item.project.slug) && TIER_RANK[item.tier] >= TIER_RANK.featured).map((item) => item.project.slug);
    if (hasContext) banner = <FeaturedSlot placement="results-banner" context={ctx} />;
    pinned = pinnedItems.length ? <FeaturedSlot placement="results-top" context={ctx} /> : null;
    if (projects.length === 0) empty = <FeaturedSlot placement="results-empty" context={{ ...ctx, location: undefined, limit: 3 }} />;
  }

  return (
    <div className="listing-page-shell space-y-4">
      <script {...jsonLdScriptProps(itemListJsonLd)} />
      <script {...jsonLdScriptProps(breadcrumbJsonLd)} />
      {banner}
      <ListingPageBody projects={organic.map(slimForHome)} h1={h1} eyebrow={eyebrow} singularEyebrow={singularEyebrow} intro={intro} basePath={basePath} filterGroups={filterGroups} emptyStateText={emptyStateText} citySectionHeading={citySectionHeading} sponsored={sponsored} premiumPinSlugs={premiumPinSlugs} topSlot={pinned} />
      {empty}
      {about ? <SeoAboutBlock title={about.title} paragraphs={about.paragraphs} /> : null}
    </div>
  );
}

import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { getAllNeighborhoods } from "@/lib/neighborhood-store";
import { getSiteUrl } from "@/lib/seo";
import type { Project } from "@/types";

// /llms.txt — a plain-text map of the site for AI assistants (ChatGPT, Claude, Perplexity, Grok, Gemini).
// Built from the live data, so new listings appear without anyone editing a file. Only facts that are stored
// on the listing itself (name, place, developer, status); nothing is estimated.
export const revalidate = 3600;

const clean = (value: string | undefined) => (value ?? "").replace(/\s+/g, " ").trim();
const moneyOf = (p: Project) => (p.priceCurrency === "USD" ? `USD ${Math.round(p.startingPriceLkr / (p.lkrPerUsd || 330.716)).toLocaleString("en-US")}` : `Rs. ${Math.round(p.startingPriceLkr).toLocaleString("en-LK")}`);

export async function GET() {
  const site = getSiteUrl();
  const [projects, lands, developers, neighborhoods] = await Promise.all([
    getAllProjects().catch(() => []),
    getAllLands().catch(() => []),
    getAllDevelopers().catch(() => []),
    getAllNeighborhoods().catch(() => []),
  ]);

  const lines: string[] = [
    "# LankaNewHomes",
    "",
    "> LankaNewHomes is Sri Lanka's marketplace for new homes: apartments, houses, villas and land from developers and builders, listed directly by them. Every project page has photos, floor plans, payment plans, amenities, nearby places and a map, and buyers can enquire with the developer directly. Listing is free for developers.",
    "",
    "## Key pages",
    `- [All new projects](${site}/projects): search and filter every listed project`,
    `- [Land for sale](${site}/land): residential plots and land projects`,
    `- [Developers](${site}/developers): the directory of property developers`,
    `- [Neighbourhood guides](${site}/neighborhoods): area guides with landmarks and the projects in each area`,
    `- [Guides](${site}/guides): buying guides for new homes in Sri Lanka`,
    `- [For developers](${site}/for-developers): how developers list projects`,
    `- [About](${site}/about)`,
    `- [Contact](${site}/contact)`,
    "",
    "## Developers",
    ...developers.map((d) => `- [${clean(d.name)}](${site}/developers/${d.slug})${d.location ? `: ${clean(d.location)}` : ""}`),
    "",
    "## Projects",
    ...projects
      .filter((p) => p.slug && p.name)
      .map((p) => {
        const facts = [clean(p.location), clean(p.developerName), clean(p.status), p.startingPriceLkr > 0 ? `from ${moneyOf(p)}` : "", p.units ? `${p.units} units` : "", p.completionYear ? `completion ${p.completionYear}` : ""].filter(Boolean).join(", ");
        return `- [${clean(p.name)}](${site}/projects/${p.slug}): ${facts} ([markdown](${site}/llms/projects/${p.slug}.md))`;
      }),
    "",
    "## Land",
    ...lands
      .filter((l) => l.slug && l.title)
      .map((l) => {
        const plots = (l.plots ?? []).length || l.plotCount || 0;
        const facts = [clean(l.location), clean(l.sellerName), clean(l.status), l.pricePerPerchLkrMin ? `from Rs. ${Math.round(l.pricePerPerchLkrMin).toLocaleString("en-LK")} per perch` : l.priceLkr > 0 ? `Rs. ${Math.round(l.priceLkr).toLocaleString("en-LK")}` : "", plots ? `${plots} plots` : ""].filter(Boolean).join(", ");
        return `- [${clean(l.title)}](${site}/land/${l.slug}): ${facts} ([markdown](${site}/llms/land/${l.slug}.md))`;
      }),
    "",
    "## Neighbourhoods",
    ...neighborhoods.map((n) => `- [${clean(n.name)}](${site}/neighborhoods/${n.slug})`),
    "",
    "## Notes for assistants",
    "- Prices, availability and payment plans are set by each developer; always send people to the listing page and the developer for current figures.",
    "- Every project and land listing also has a clean markdown version (the [markdown] link after each entry) with the same facts: price, size, floor plans, amenities, nearby places and payment terms.",
    `- Plain-language search also works: ${site}/search?q=2+bedroom+apartment+in+Colombo+under+50M`,
    `- Sitemap: ${site}/sitemap.xml`,
    "",
  ];

  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}

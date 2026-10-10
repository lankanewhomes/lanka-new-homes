import { toAbsoluteUrl, withSocial } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, CircleDollarSign, Compass, HousePlus, Layers, MapPin, Ruler, Tag } from "lucide-react";
import { getAllLands, getLandBySlug } from "@/lib/land-store";
import { buildLandDetailRows, formatLandSize, landToProjectShape } from "@/lib/land-to-project";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { pickSimilarListings } from "@/lib/similar-listings";
import { SimilarListingsSection } from "@/components/marketplace/similar-listings";
import { formatLkr } from "@/lib/format";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { LandPlotsGridSection } from "@/components/marketplace/land-plots-grid";
import { PLOT_GRID_THRESHOLD } from "@/lib/plot-grid";
import { listingWhatsAppHref, toWhatsAppNumber } from "@/lib/whatsapp";
import { VERIFIED_DEVELOPER_TOOLTIP } from "@/lib/developer-badges";
import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import {
  AmenitiesShowcaseSection,
  KeyFeaturesSection,
  OwnershipServicesSection,
  LandDetailsTable,
  NeighborhoodSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectHero,
  StatsContactCard,
} from "@/components/marketplace/components";
import type { Developer } from "@/types";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type LandPageProps = { params: Promise<{ slug: string }> };

// Titles get " | LankaNewHomes" appended by the root layout; search results cut off past ~60 characters
// in total, so use the shorter form when the full one would overflow.
const TITLE_BUDGET = 60 - " | LankaNewHomes".length;
function fitTitle(full: string, short: string): string {
  if (full.length <= TITLE_BUDGET) return full;
  return short.length <= TITLE_BUDGET ? short : `${short.slice(0, TITLE_BUDGET - 1).trimEnd()}…`;
}

// A land listing with no written summary still needs a meta description (SEO audit, 2026-10-01).
function fallbackLandDescription(land: { title: string; location: string; description?: string; landSizePerches?: number; sellerName?: string }): string {
  const text = land.description?.replace(/\s+/g, " ").trim();
  if (text) return text.length > 155 ? `${text.slice(0, 154).trimEnd()}…` : text;
  return `${land.title} — land for sale in ${land.location}${land.sellerName ? ` by ${land.sellerName}` : ""}. See plot sizes, payment plans, nearby places and the location map on LankaNewHomes.`;
}

export async function generateMetadata({ params }: LandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const land = await getLandBySlug(slug);

  if (!land) {
    return { title: "Land Listing Not Found", robots: { index: false, follow: false } };
  }

  return withSocial({
    title: fitTitle(`${land.title} - Land for Sale in ${land.location}`, `${land.title} - Land for Sale`),
    description: land.summary?.trim() || fallbackLandDescription(land),
    alternates: { canonical: `/land/${land.slug}` },
    robots: land.status === "Sold" ? { index: false, follow: true } : undefined,
  }, { socialTitle: `${land.title} - Land for Sale in ${land.location}`, image: land.heroImage, imageAlt: land.title });
}

export default async function LandDetailPage({ params }: LandPageProps) {
  const { slug } = await params;
  const land = await getLandBySlug(slug);
  if (!land) return notFound();

  const project = landToProjectShape(land);
  const otherLands = (await getAllLands()).filter((item) => item.slug !== land.slug).map(landToProjectShape);
  const similarListings = pickSimilarListings(project, otherLands, 4);

  // Land has no dedicated neighborhood relationship field (unlike Project) — its
  // "neighborhood" is already just the city (see landToProjectShape), so a
  // matching Neighborhoods page is looked up by slugifying that city name.
  const cityNeighborhoodSlug = land.city
    ? land.city.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-")
    : undefined;
  const neighborhood = cityNeighborhoodSlug ? await getNeighborhoodBySlug(cityNeighborhoodSlug) : undefined;

  let developer: Developer | undefined;
  if (land.sellerType === "developer" && land.sellerSlug) {
    developer = await getDeveloperBySlug(land.sellerSlug);
  } else if (land.sellerType === "construction_company" && land.sellerSlug) {
    const companies = await getAllConstructionCompanies();
    const company = companies.find((entry) => entry.slug === land.sellerSlug);
    if (company) {
      developer = {
        slug: company.slug,
        name: company.name,
        logo: company.logo,
        description: company.description,
        location: company.location,
        establishedYear: 0,
        yearsInBusiness: company.yearsInBusiness ?? 0,
        activeProjects: 0,
        completedProjects: 0,
        website: company.website ?? "",
        email: company.email ?? "",
        phone: company.phone ?? "",
        socialLinks: company.socialLinks,
      };
    }
  }

  const plots = land.plots ?? [];
  const totalPlots = plots.length;
  const plotsAvailable = plots.filter((plot) => plot.status === "Available").length;
  const plotsSold = plots.filter((plot) => plot.status === "Sold").length;
  // Plans give lot numbers and sizes only: show available/sold counts only when the developer stated a status.
  const plotStatusStated = plots.some((plot) => plot.status);
  // Some developers publish only a total plot count ("Only 12 exclusive
  // plots"), never individual plot numbers/sizes/prices — plotCount covers
  // that case without inventing a fake available/sold breakdown we don't
  // actually have (see plotCount's own admin description on Lands.ts).
  const hasPlotBreakdown = totalPlots > 0;
  const plotCountOnly = !hasPlotBreakdown && (land.plotCount ?? 0) > 0;

  const stats: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: HousePlus, label: "Listing status", value: land.status },
    { icon: CircleDollarSign, label: "Price range", value: land.priceLkr > 0 ? formatLkr(land.priceLkr) : (project.priceRange || "Contact for pricing") },
    { icon: MapPin, label: "Address", value: land.location },
    ...(hasPlotBreakdown ? [{ icon: Layers, label: "Total plots", value: String(totalPlots) }] : []),
    ...(hasPlotBreakdown && plotStatusStated ? [{ icon: CheckCircle2, label: "Plots available", value: String(plotsAvailable) }] : []),
    ...(hasPlotBreakdown && plotStatusStated ? [{ icon: Tag, label: "Plots sold", value: String(plotsSold) }] : []),
    ...(plotCountOnly ? [{ icon: Layers, label: "Total plots", value: String(land.plotCount) }] : []),
    ...(land.landSizePerches > 0 ? [{ icon: Ruler, label: "Land size", value: formatLandSize(land) ?? `${land.landSizePerches} perches` }] : []),
    { icon: Compass, label: "Land use", value: land.landUse.join(" & ") },
  ];

  const detailRows = buildLandDetailRows(land);

  // Structured data so search engines and AI assistants can read the listing (SEO/AI audit, 2026-10-01).
  const structuredData = {
    "@context": "https://schema.org",
    // Google's Product rich result needs offers/review/aggregateRating: land with no published price is a plain listing instead.
    "@type": land.priceLkr > 0 ? "Product" : "RealEstateListing",
    name: land.title,
    description: land.summary?.trim() || fallbackLandDescription(land),
    image: [land.heroImage, ...(land.gallery ?? []).map((item) => item.image)].filter(Boolean),
    category: "Land for sale",
    ...(land.priceLkr > 0 ? { brand: { "@type": "Brand", name: land.sellerName } } : { provider: { "@type": "Organization", name: land.sellerName } }),
    url: toAbsoluteUrl(`/land/${land.slug}`),
    ...(land.priceLkr > 0
      ? { offers: { "@type": "Offer", priceCurrency: "LKR", price: land.priceLkr, availability: land.status === "Sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url: toAbsoluteUrl(`/land/${land.slug}`) } }
      : {}),
    ...(land.priceLkr > 0
      ? {
          additionalProperty: [
            { "@type": "PropertyValue", name: "Location", value: land.location },
            { "@type": "PropertyValue", name: "Status", value: land.status },
          ],
        }
      : {}),
  };

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <ProjectHero
        project={project}
        backHref="/land"
        backLabel="Land for Sale"
        statusLabelOverride={land.status}
        extraBadges={[
          ...(developer?.respondsWithinHour ? [{ label: "Responds within 24 hours", kind: "responder" as const }] : []),
          // Land has no package system yet (Projects-only, src/lib/packages.ts), so no "★ Featured" here; the free
          // Verified Developer badge doesn't depend on a package, so it can show.
          ...(developer?.domainVerified ? [{ label: "✓ Verified Developer", kind: "verified" as const, title: VERIFIED_DEVELOPER_TOOLTIP }] : []),
          ...(project.startingPriceLkr === 0 ? [{ label: "Contact for pricing", kind: "contact-pricing" as const }] : []),
          ...(land.badges ?? []),
        ]}
        plansHomesNavLabel="Plots"
        amenitiesNavLabel="Facilities"
        roadMapImages={land.roadMapImages ?? []}
        blockPlanImages={land.blockPlanImages ?? []}
        videoLinks={land.videos ?? []}
        requestInfoVariant="inquiry"
        whatsappHref={listingWhatsAppHref(developer?.socialLinks?.whatsapp ?? (toWhatsAppNumber(land.contact?.phone)?.startsWith("947") ? land.contact?.phone : null), project.name)}
      />

      <div className="project-page-content">
        <div className="listing-hero-stats-chips land-stats-chips" role="list" aria-label="Land summary stats">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} role="listitem" className="listing-hero-stat-chip">
                <Icon className="listing-hero-stat-chip-icon" aria-hidden="true" />
                <div className="listing-hero-stat-chip-content">
                  <span className="listing-hero-stat-chip-value">{stat.value}</span>
                  <span className="listing-hero-stat-chip-label">{stat.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {land.description ? (
          <section id="overview" className="project-description-shell" aria-label="Overview">
            <h2>Overview</h2>
            {land.facilities && land.facilities.length > 0 ? (
              <ul className="project-description-highlights">
                {land.facilities.map((facility) => (
                  <li key={facility}>{facility}</li>
                ))}
              </ul>
            ) : null}
            <p style={{ whiteSpace: "pre-line" }}>{land.description}</p>
          </section>
        ) : null}

        <LandDetailsTable rows={detailRows} />

        {plots.length > PLOT_GRID_THRESHOLD ? (
          <LandPlotsGridSection plots={plots} project={project} blockPlan={land.blockPlanImages?.[0]?.image} />
        ) : (
          <PlansAndHomesSection project={project} title="Plots" showQuickMoveIns={false} showBedBath={false} planHrefBase={`/land/${land.slug}/plots`} />
        )}

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <KeyFeaturesSection unitFeatures={project.unitFeatures} />
        <OwnershipServicesSection ownershipServices={project.ownershipServices} title="Services" />

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} title="Facilities" />

        <NeighborhoodSection
          nearby={project.nearby}
          neighborhoodName={project.neighborhood} neighborhoodSlug={cityNeighborhoodSlug} neighborhoodPageExists={Boolean(neighborhood)}
          // Same preview card (photo, excerpt, highlights, guide link) the project page shows.
          neighborhood={neighborhood ? { name: neighborhood.name, slug: neighborhood.slug, heroImage: neighborhood.heroImage, description: neighborhood.description, highlights: neighborhood.highlights } : undefined}
        />

        <StatsContactCard project={project} developer={developer} requestInfoVariant="inquiry" />

        <SimilarListingsSection listings={similarListings} basePath="/land" />
      </div>
    </div>
  );
}

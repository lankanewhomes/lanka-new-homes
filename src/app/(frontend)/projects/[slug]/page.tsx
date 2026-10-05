import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getAllProjects, getProjectBySlug } from "@/lib/project-store";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { listingWhatsAppHref } from "@/lib/whatsapp";
import { hasPremiumStyleBadge, isPaidPackageTier } from "@/lib/packages";
import { FEATURED_TOOLTIP, VERIFIED_DEVELOPER_TOOLTIP } from "@/lib/developer-badges";
import { pickSimilarListings } from "@/lib/similar-listings";
import { SimilarListingsSection } from "@/components/marketplace/similar-listings";
import {
  AmenitiesShowcaseSection,
  CommercialAreasSection,
  KeyFeaturesSection,
  OwnershipServicesSection,
  NeighborhoodSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  ProjectNarrativeDetails,
  ProjectStatsChips,
  StatsContactCard,
} from "@/components/marketplace/components";
import { ProjectViewTracker } from "@/components/marketplace/view-tracker";
import { toAbsoluteUrl } from "@/lib/seo";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type ProjectPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: { index: false, follow: false },
    };
  }

  const homeLabel = /villa/i.test(project.type) ? "Villas" : /house|housing|home/i.test(project.type) ? "Homes" : "Apartments";
  const fullTitle = `${project.name} - New ${homeLabel} in ${project.location}`;
  // The root layout appends " | LankaNewHomes"; keep the whole title within ~60 characters.
  const titleBudget = 60 - " | LankaNewHomes".length;
  const shortTitle = `${project.name} - New ${homeLabel}`;
  const title = fullTitle.length <= titleBudget ? fullTitle : shortTitle.length <= titleBudget ? shortTitle : `${project.name.slice(0, titleBudget - 1).trimEnd()}…`;
  const description = `${project.summary} Starting from ${project.priceRange}. Explore floor plans, amenities, and availability.`;
  const canonicalPath = `/projects/${project.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      type: "article",
      images: [
        {
          url: project.heroImage,
          alt: project.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [project.heroImage],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  const [neighborhood, developer, allProjects] = await Promise.all([
    project.neighborhoodSlug ? getNeighborhoodBySlug(project.neighborhoodSlug) : Promise.resolve(undefined),
    getDeveloperBySlug(project.developerSlug),
    getAllProjects(),
  ]);
  const similarListings = pickSimilarListings(project, allProjects, 4);

  // Google's Product rich result needs a real offer (offers/review/aggregateRating): a listing with no published
  // price is a plain RealEstateListing instead of a Product with a price of 0.
  const hasPrice = project.startingPriceLkr > 0;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": hasPrice ? "Product" : "RealEstateListing",
    name: project.name,
    description: project.summary,
    image: [project.heroImage, ...project.gallery.map((item) => item.image)],
    ...(hasPrice
      ? {
          brand: {
            "@type": "Brand",
            name: project.developerName,
          },
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            price: project.startingPriceLkr,
            availability:
              project.status === "Coming Soon"
                ? "https://schema.org/PreOrder"
                : "https://schema.org/InStock",
            url: toAbsoluteUrl(`/projects/${project.slug}`),
          },
          additionalProperty: [
            { "@type": "PropertyValue", name: "Bedrooms", value: project.bedrooms },
            { "@type": "PropertyValue", name: "Bathrooms", value: project.bathrooms },
            { "@type": "PropertyValue", name: "Floor Area", value: project.floorAreaRange },
            { "@type": "PropertyValue", name: "Status", value: project.status },
          ],
        }
      : { provider: { "@type": "Organization", name: project.developerName } }),
    url: toAbsoluteUrl(`/projects/${project.slug}`),
  };

  return (
    <div className="space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <ProjectViewTracker projectSlug={project.slug} projectName={project.name} developerSlug={project.developerSlug} />
      <ProjectHero
        project={project}
        backHref="/projects"
        backLabel="New Projects"
        whatsappHref={listingWhatsAppHref(project.socialLinks?.whatsapp ?? developer?.socialLinks?.whatsapp, project.name)}
        roadMapImages={project.roadMapImages ?? []}
        blockPlanImages={project.blockPlanImages ?? []}
        extraBadges={[
          ...(developer?.respondsWithinHour ? [{ label: "Responds within 24 hours", kind: "responder" as const }] : []),
          ...(developer?.domainVerified ? [{ label: "✓ Verified Developer", kind: "verified" as const, title: VERIFIED_DEVELOPER_TOOLTIP }] : []),
          // Paid pill: only when the hero isn't already showing its own Featured/Premium pill for this project.
          ...(isPaidPackageTier(project.package) && !project.isFeatured && !hasPremiumStyleBadge(project.package) ? [{ label: "★ Featured", kind: "featured" as const, title: FEATURED_TOOLTIP }] : []),
          ...(project.startingPriceLkr === 0 ? [{ label: "Contact for pricing", kind: "contact-pricing" as const }] : []),
          // availabilityBadge/marketingBadges (Limited Units, Popular, BOI
          // Approved Project, etc.) are deliberately NOT rendered here
          // (2026-09-18) — kept as editable /cms fields for internal
          // record-keeping, but the front-end no longer shows them.
          ...(project.locationBadges ?? []).map((label) => ({ label, kind: "location" as const })),
          // The one marketing badge shown on the page (owner, 2026-10-04): the ICON net profit-sharing model.
          ...(project.marketingBadges ?? []).filter((label) => label === "Profit-Share Model").map((label) => ({ label, kind: "marketing" as const })),
        ]}
      />

      <div className="project-page-content">
        <ProjectStatsChips project={project} />
        <ProjectDescriptionSection project={project} developer={developer} />

        <ProjectNarrativeDetails project={project} />


        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <KeyFeaturesSection unitFeatures={project.unitFeatures} />
        <OwnershipServicesSection ownershipServices={project.ownershipServices} />

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} />

        <CommercialAreasSection commercialAreas={project.commercialAreas ?? []} />

        <PlansAndHomesSection project={project} />

        <NeighborhoodSection
          nearby={project.nearby}
          neighborhoodName={project.neighborhood}
          neighborhoodSlug={project.neighborhoodSlug}
          neighborhoodPageExists={Boolean(neighborhood)}
          neighborhood={neighborhood ? { name: neighborhood.name, slug: neighborhood.slug, heroImage: neighborhood.heroImage, description: neighborhood.description, highlights: neighborhood.highlights } : undefined}
        />

        <StatsContactCard project={project} developer={developer} />

        <SimilarListingsSection listings={similarListings} />
      </div>
    </div>
  );
}

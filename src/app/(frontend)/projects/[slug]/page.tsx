import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getAllProjects, getProjectBySlug } from "@/lib/project-store";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { listingWhatsAppHref } from "@/lib/whatsapp";
import { pickSimilarListings } from "@/lib/similar-listings";
import { SimilarListingsSection } from "@/components/marketplace/similar-listings";
import {
  AmenitiesShowcaseSection,
  CommercialAreasSection,
  ConstructionTimelineSection,
  KeyFeaturesSection,
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

  const title = `${project.name} - New Apartments in ${project.location}`;
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

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.name,
    description: project.summary,
    image: [project.heroImage, ...project.gallery.map((item) => item.image)],
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
        whatsappHref={listingWhatsAppHref(developer?.socialLinks?.whatsapp, project.name)}
        extraBadges={[
          ...(developer?.respondsWithinHour ? [{ label: "Responds within 1 hour", kind: "responder" as const }] : []),
          ...(developer?.verificationStatus === "approved" ? [{ label: "Verified", kind: "verified" as const }] : []),
          ...(project.startingPriceLkr === 0 ? [{ label: "Contact for pricing", kind: "contact-pricing" as const }] : []),
          ...(project.availabilityBadge ? [{ label: project.availabilityBadge, kind: "availability" as const }] : []),
          ...(project.marketingBadges ?? []).map((label) => ({ label, kind: "marketing" as const })),
          ...(project.locationBadges ?? []).map((label) => ({ label, kind: "location" as const })),
        ]}
      />

      <div className="project-page-content">
        <ProjectStatsChips project={project} />
        <ProjectDescriptionSection project={project} />

        <ProjectNarrativeDetails project={project} />

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <KeyFeaturesSection unitFeatures={project.unitFeatures} />

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} />

        <CommercialAreasSection commercialAreas={project.commercialAreas ?? []} />

        <PlansAndHomesSection project={project} />

        <ConstructionTimelineSection updates={project.constructionUpdates ?? []} />

        <NeighborhoodSection nearby={project.nearby} neighborhoodName={project.neighborhood} neighborhoodSlug={project.neighborhoodSlug} neighborhoodPageExists={Boolean(neighborhood)} />

        <StatsContactCard project={project} developer={developer} />

        <SimilarListingsSection listings={similarListings} />
      </div>
    </div>
  );
}

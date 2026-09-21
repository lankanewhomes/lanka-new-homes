import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getAllProjects, getProjectBySlug } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { listingWhatsAppHref } from "@/lib/whatsapp";
import { pickSimilarListings } from "@/lib/similar-listings";
import { SimilarListingsSection } from "@/components/marketplace/similar-listings";
import { FloorPlanFactSheet, FloorPlanStatsChips } from "@/components/marketplace/floor-plan-facts";
import {
  AmenitiesShowcaseSection,
  KeyFeaturesSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  StatsContactCard,
} from "@/components/marketplace/components";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type FloorPlanPageProps = {
  params: Promise<{ slug: string; floorPlanId: string }>;
};

export function generateStaticParams() {
  return projects.flatMap((project) => project.floorPlans.map((floorPlan) => ({
    slug: project.slug,
    floorPlanId: floorPlan.id,
  })));
}

export async function generateMetadata({ params }: FloorPlanPageProps): Promise<Metadata> {
  const { slug, floorPlanId } = await params;
  const project = await getProjectBySlug(slug);
  const floorPlan = project?.floorPlans.find((item) => item.slug === floorPlanId || item.id === floorPlanId);

  if (!project || !floorPlan) {
    return { title: "Floor Plan Not Found", robots: { index: false, follow: false } };
  }

  // A developer doesn't always publish every figure (e.g. no bathroom count or
  // no drawing yet) — leave the missing piece out instead of printing "0".
  const planFacts = [
    floorPlan.bedrooms > 0 ? `${floorPlan.bedrooms} bedrooms` : "",
    floorPlan.bathrooms > 0 ? `${floorPlan.bathrooms} bathrooms` : "",
    floorPlan.floorAreaSqFt > 0 ? `${floorPlan.floorAreaSqFt} sq.ft` : "",
  ].filter(Boolean);
  const planFactsText =
    planFacts.length > 2 ? `${planFacts.slice(0, -1).join(", ")}, and ${planFacts[planFacts.length - 1]}` : planFacts.join(" and ");

  return {
    title: `${floorPlan.planName} Floor Plan - ${project.name}`,
    description: `${floorPlan.planName} floor plan at ${project.name}${planFactsText ? `: ${planFactsText}` : ""}.`,
    alternates: { canonical: `/projects/${project.slug}/floor-plans/${floorPlan.slug ?? floorPlan.id}` },
    openGraph: {
      title: `${floorPlan.planName} Floor Plan - ${project.name}`,
      description: `Explore the ${floorPlan.planName} floor plan at ${project.name}.`,
      url: `/projects/${project.slug}/floor-plans/${floorPlan.slug ?? floorPlan.id}`,
      images: floorPlan.image ? [{ url: floorPlan.image, alt: floorPlan.planName }] : undefined,
    },
  };
}

export default async function FloorPlanDetailPage({ params }: FloorPlanPageProps) {
  const { slug, floorPlanId } = await params;
  const project = await getProjectBySlug(slug);
  const floorPlan = project?.floorPlans.find((item) => item.slug === floorPlanId || item.id === floorPlanId);

  if (!project || !floorPlan) return notFound();

  const [developer, allProjects] = await Promise.all([getDeveloperBySlug(project.developerSlug), getAllProjects()]);
  const similarListings = pickSimilarListings(project, allProjects, 4);

  return (
    <div className="space-y-8">
      <ProjectHero
        project={project}
        titleOverride={floorPlan.planName}
        heroImageOverride={floorPlan.image}
        floorPlan={floorPlan}
        showAmenitiesAndNeighborhoodNav={false}
        backHref={`/projects/${project.slug}`}
        backLabel={project.name}
        plansHomesNavLabel="Other floor plans"
        whatsappHref={listingWhatsAppHref(developer?.socialLinks?.whatsapp, project.name, floorPlan.planName)}
        extraBadges={[
          ...(developer?.respondsWithinHour ? [{ label: "Responds within 1 hour", kind: "responder" as const }] : []),
          ...(project.package === "featured" || project.package === "premium" ? [{ label: "Verified", kind: "verified" as const }] : []),
          ...(floorPlan.startingPriceLkr === 0 ? [{ label: "Contact for pricing", kind: "contact-pricing" as const }] : []),
        ]}
      />

      <div className="project-page-content">
        <FloorPlanStatsChips floorPlan={floorPlan} />
        <ProjectDescriptionSection project={project} floorPlan={floorPlan} />

        <FloorPlanFactSheet floorPlan={floorPlan} />

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} floorPlan={floorPlan} />
        </section>

        <KeyFeaturesSection unitFeatures={project.unitFeatures} />

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} />

        <PlansAndHomesSection project={project} title="Other floor plans" excludeFloorPlanId={floorPlan.id} />

        <StatsContactCard project={project} developer={developer} />

        <SimilarListingsSection listings={similarListings} />
      </div>
    </div>
  );
}

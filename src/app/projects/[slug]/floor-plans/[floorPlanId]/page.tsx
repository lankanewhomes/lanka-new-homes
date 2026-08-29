import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getProjectBySlug } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import {
  AmenitiesShowcaseSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  ProjectNarrativeDetails,
  ProjectStatsChips,
  StatsContactCard,
} from "@/components/marketplace/components";

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
  const floorPlan = project?.floorPlans.find((item) => item.id === floorPlanId);

  if (!project || !floorPlan) {
    return { title: "Floor Plan Not Found", robots: { index: false, follow: false } };
  }

  return {
    title: `${floorPlan.planName} Floor Plan - ${project.name}`,
    description: `${floorPlan.planName} floor plan at ${project.name}: ${floorPlan.bedrooms} bedrooms, ${floorPlan.bathrooms} bathrooms, and ${floorPlan.floorAreaSqFt} sq.ft.`,
    alternates: { canonical: `/projects/${project.slug}/floor-plans/${floorPlan.id}` },
    openGraph: {
      title: `${floorPlan.planName} Floor Plan - ${project.name}`,
      description: `Explore the ${floorPlan.planName} floor plan at ${project.name}.`,
      url: `/projects/${project.slug}/floor-plans/${floorPlan.id}`,
      images: [{ url: floorPlan.image, alt: floorPlan.planName }],
    },
  };
}

export default async function FloorPlanDetailPage({ params }: FloorPlanPageProps) {
  const { slug, floorPlanId } = await params;
  const project = await getProjectBySlug(slug);
  const floorPlan = project?.floorPlans.find((item) => item.id === floorPlanId);

  if (!project || !floorPlan) return notFound();

  const developer = await getDeveloperBySlug(project.developerSlug);

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
      />

      <div className="project-page-content">
        <ProjectStatsChips project={project} floorPlan={floorPlan} />
        <ProjectDescriptionSection project={project} headingOverride={`${floorPlan.planName} Details`} />

        <ProjectNarrativeDetails project={project} />

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} />

        <PlansAndHomesSection project={project} title="Other floor plans" excludeFloorPlanId={floorPlan.id} />

        <StatsContactCard project={project} developer={developer} />
      </div>
    </div>
  );
}

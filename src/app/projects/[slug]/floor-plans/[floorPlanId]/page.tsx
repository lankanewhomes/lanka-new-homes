import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import {
  AmenitiesShowcaseSection,
  FloorPlanListingTabs,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  ProjectNarrativeDetails,
  SalesCenterSection,
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
  const project = projects.find((item) => item.slug === slug);
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
  const project = projects.find((item) => item.slug === slug);
  const floorPlan = project?.floorPlans.find((item) => item.id === floorPlanId);

  if (!project || !floorPlan) return notFound();

  return (
    <div className="space-y-8">
      <ProjectHero project={project} />
      <FloorPlanListingTabs project={project} floorPlan={floorPlan} />
      <ProjectDescriptionSection project={project} />
      <ProjectNarrativeDetails project={project} />
      <section id="pricing" className="space-y-3">
        <PricingInformationLayout project={project} />
      </section>
      <SalesCenterSection project={project} />
      <PlansAndHomesSection project={project} />
      <AmenitiesShowcaseSection project={project} />
    </div>
  );
}

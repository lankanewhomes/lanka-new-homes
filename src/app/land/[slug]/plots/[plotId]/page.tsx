import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllLands, getLandBySlug } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
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

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type PlotPageProps = {
  params: Promise<{ slug: string; plotId: string }>;
};

export async function generateStaticParams() {
  const lands = await getAllLands();
  return lands.flatMap((land) => (land.plots ?? []).map((plot) => ({ slug: land.slug, plotId: plot.id })));
}

export async function generateMetadata({ params }: PlotPageProps): Promise<Metadata> {
  const { slug, plotId } = await params;
  const land = await getLandBySlug(slug);
  const plot = land?.plots?.find((item) => item.id === plotId);

  if (!land || !plot) {
    return { title: "Plot Not Found", robots: { index: false, follow: false } };
  }

  return {
    title: `${plot.name} - ${land.title}`,
    description: `${plot.name} at ${land.title}: ${plot.sizePerches} perches.`,
    alternates: { canonical: `/land/${land.slug}/plots/${plot.id}` },
    openGraph: {
      title: `${plot.name} - ${land.title}`,
      description: `Explore ${plot.name} at ${land.title}.`,
      url: `/land/${land.slug}/plots/${plot.id}`,
      images: [{ url: land.heroImage, alt: plot.name }],
    },
  };
}

export default async function LandPlotDetailPage({ params }: PlotPageProps) {
  const { slug, plotId } = await params;
  const land = await getLandBySlug(slug);
  if (!land) return notFound();

  const project = landToProjectShape(land);
  const plot = project.floorPlans.find((item) => item.id === plotId);
  if (!plot) return notFound();

  let developer;
  if (land.sellerType === "developer" && land.sellerSlug) {
    developer = await getDeveloperBySlug(land.sellerSlug);
  }

  return (
    <div className="space-y-8">
      <ProjectHero
        project={project}
        titleOverride={plot.planName}
        heroImageOverride={plot.image}
        floorPlan={plot}
        showAmenitiesAndNeighborhoodNav={false}
        backHref={`/land/${land.slug}`}
        backLabel={land.title}
        plansHomesNavLabel="Other plots"
        amenitiesNavLabel="Facilities"
        requestInfoVariant="inquiry"
      />

      <div className="project-page-content">
        <ProjectStatsChips project={project} floorPlan={plot} />
        <ProjectDescriptionSection project={project} headingOverride={`${plot.planName} Details`} />

        <ProjectNarrativeDetails project={project} />

        <section id="pricing" className="space-y-3">
          <PricingInformationLayout project={project} />
        </section>

        <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} title="Facilities" />

        <PlansAndHomesSection project={project} title="Other plots" excludeFloorPlanId={plot.id} showQuickMoveIns={false} planHrefBase={`/land/${land.slug}/plots`} />

        <StatsContactCard project={project} developer={developer} requestInfoVariant="inquiry" />
      </div>
    </div>
  );
}

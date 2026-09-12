import {
  AmenitiesShowcaseSection,
  CommercialAreasSection,
  ConstructionProgressSection,
  ConstructionTimelineSection,
  KeyFeaturesSection,
  NeighborhoodInsightsSection,
  NeighborhoodSection,
  PlansAndHomesSection,
  PricingInformationLayout,
  ProjectDescriptionSection,
  ProjectHero,
  ProjectNarrativeDetails,
  ProjectStatsChips,
  StatsContactCard,
} from "@/components/marketplace/components";
import type { Developer, Neighborhood, Project } from "@/types";

// Renders with the exact same components as the real /projects/[slug] page,
// so what a developer previews here is what buyers will see once
// isPublished is turned on — just wrapped in a banner and reachable only via
// this direct link (see src/app/(frontend)/listing-preview/[slug]/page.tsx).
export function ListingPreviewPage({
  project,
  developer,
  neighborhood,
  neighborhoodPageExists,
}: {
  project: Project;
  developer?: Developer;
  neighborhood?: Neighborhood;
  neighborhoodPageExists: boolean;
}) {
  return (
    <div>
      <p
        style={{
          margin: 0,
          padding: "10px 16px",
          background: "#1f1f1f",
          color: "#fff",
          fontSize: 13,
          textAlign: "center",
        }}
      >
        Preview only{project.isPublished ? "" : " — this listing is not live on the site yet"}. Not linked from anywhere on the site.
      </p>

      <div className="space-y-8">
        <ProjectHero
          project={project}
          backHref="/projects"
          backLabel="New Projects"
          roadMapImages={project.roadMapImages ?? []}
          blockPlanImages={project.blockPlanImages ?? []}
        />

        <div className="project-page-content">
          <ProjectStatsChips project={project} />
          <ProjectDescriptionSection project={project} />

          <ProjectNarrativeDetails project={project} />

          <ConstructionProgressSection project={project} />

          <section id="pricing" className="space-y-3">
            <PricingInformationLayout project={project} />
          </section>

          <KeyFeaturesSection unitFeatures={project.unitFeatures} />

          <AmenitiesShowcaseSection amenities={project.amenities} gallery={project.gallery} heroImage={project.heroImage} />

          <CommercialAreasSection commercialAreas={project.commercialAreas ?? []} />

          <PlansAndHomesSection project={project} />

          <ConstructionTimelineSection updates={project.constructionUpdates ?? []} />

          <NeighborhoodSection
            nearby={project.nearby}
            neighborhoodName={project.neighborhood}
            neighborhoodSlug={project.neighborhoodSlug}
            neighborhoodPageExists={neighborhoodPageExists}
          />

          <NeighborhoodInsightsSection
            projectName={project.name}
            nearby={project.nearby}
            neighborhood={neighborhood}
            city={project.city}
            district={project.district}
            province={project.province}
            coordinates={project.coordinates}
            location={project.location}
          />

          <StatsContactCard project={project} developer={developer} />
        </div>
      </div>
    </div>
  );
}

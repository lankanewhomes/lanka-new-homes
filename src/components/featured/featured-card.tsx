import { ListingGridCard } from "@/components/marketplace/listing-page";
import { FeaturedTrack } from "@/components/featured/featured-track";
import { slimForHome } from "@/lib/home-slim";
import { TIER_RANK, type FeaturedTier, type Placement } from "@/lib/featured/config";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import type { Developer, Project } from "@/types";
import "./featured.css";

export function DemoFlag() {
  return FEATURED_DEMO ? <span className="fp-demo-flag" title="Demo data: removed before launch">DEMO</span> : null;
}

/** The ordinary listing card, plus a "Featured" badge on the photo. Premium and Elite cards also show the developer's logo and a Video tag. */
export function FeaturedCard({ project, tier, placement, developer, basePath = "/projects" }: { project: Project; tier: FeaturedTier; placement: Placement; developer?: Developer; basePath?: string }) {
  const premium = TIER_RANK[tier] >= TIER_RANK.premium;
  return (
    <FeaturedTrack placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO} className="fp-card">
      <ListingGridCard project={slimForHome(project)} basePath={basePath} featured={{ tier, logo: premium ? developer?.logo : undefined, hasVideo: premium && (project.videos?.length ?? 0) > 0 }} />
    </FeaturedTrack>
  );
}

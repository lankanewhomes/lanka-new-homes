import Image from "next/image";
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

/** A project card with the "Featured" label. Premium and Elite cards also show the developer's logo and a Video link. */
export function FeaturedCard({ project, tier, placement, developer, basePath = "/projects" }: { project: Project; tier: FeaturedTier; placement: Placement; developer?: Developer; basePath?: string }) {
  const premium = TIER_RANK[tier] >= TIER_RANK.premium;
  const hasVideo = (project.videos?.length ?? 0) > 0;
  return (
    <FeaturedTrack placement={placement} projectSlug={project.slug} developer={project.developerSlug} demo={FEATURED_DEMO} className={`fp-card fp-card--${tier}`}>
      <div className="fp-card-label">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2 2.9 6.9 7.1.6-5.4 4.7 1.7 7.1L12 17.6 5.7 21.3l1.7-7.1L2 9.5l7.1-.6z" /></svg>
        Featured<DemoFlag />
      </div>
      <ListingGridCard project={slimForHome(project)} basePath={basePath} />
      {premium ? (
        <div className="fp-card-foot">
          {developer?.logo ? <Image src={developer.logo} alt="" width={28} height={28} unoptimized /> : null}
          <span>{project.developerName}</span>
          {hasVideo ? <a className="fp-card-video" href={`${basePath}/${project.slug}#videos`} aria-label={`Watch video: ${project.name}`}>▶ Video</a> : null}
        </div>
      ) : null}
    </FeaturedTrack>
  );
}

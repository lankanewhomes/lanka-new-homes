import { ListingGridCard } from "@/components/marketplace/listing-page";
import { T } from "@/components/layout/t";
import type { Project } from "@/types";

// "Similar listings" — the last section on every detail page, right under
// the builder/contact card. Same boxed shell and card grid as the
// neighborhood page's "New homes in …" section (.developer-projects-section
// + ListingGridCard), so the three places that list projects look alike.
// Server component: the ranking happens in the page, this only renders.
export function SimilarListingsSection({
  listings,
  basePath = "/projects",
  title = "Similar listings",
}: {
  listings: Project[];
  basePath?: "/projects" | "/land";
  title?: string;
}) {
  if (!listings.length) return null;

  return (
    <section className="developer-projects-section similar-listings-section" aria-label={title}>
      <h2><T>{title}</T></h2>
      <div className="home-card-grid developer-projects-grid">
        {listings.map((project) => (
          <ListingGridCard key={project.slug} project={project} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}

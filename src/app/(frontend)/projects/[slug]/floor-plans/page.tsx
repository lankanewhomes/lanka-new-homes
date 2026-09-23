import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";
import { getAllProjects, getProjectBySlug } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { listingWhatsAppHref } from "@/lib/whatsapp";
import { pickSimilarListings } from "@/lib/similar-listings";
import { SimilarListingsSection } from "@/components/marketplace/similar-listings";
import { PlansAndHomesSection, ProjectHero, ProjectStatsChips, StatsContactCard } from "@/components/marketplace/components";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type FloorPlansPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: FloorPlansPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Floor Plans Not Found", robots: { index: false, follow: false } };

  return {
    title: `${project.name} Floor Plans`,
    description: `Explore all floor plans and homes available at ${project.name}.`,
    alternates: { canonical: `/projects/${project.slug}/floor-plans` },
  };
}

export default async function FloorPlansPage({ params }: FloorPlansPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  const [developer, allProjects] = await Promise.all([getDeveloperBySlug(project.developerSlug), getAllProjects()]);
  const similarListings = pickSimilarListings(project, allProjects, 4);

  return (
    <div className="space-y-8">
      <ProjectHero
        project={project}
        backHref={`/projects/${project.slug}`}
        backLabel={project.name}
        sectionNavBase={`/projects/${project.slug}`}
        whatsappHref={listingWhatsAppHref(developer?.socialLinks?.whatsapp, project.name)}
        extraBadges={[
          ...(developer?.respondsWithinHour ? [{ label: "Responds within 1 hour", kind: "responder" as const }] : []),
          ...(project.package === "featured" || project.package === "premium" ? [{ label: "Verified", kind: "verified" as const }] : []),
          ...(project.startingPriceLkr === 0 ? [{ label: "Contact for pricing", kind: "contact-pricing" as const }] : []),
        ]}
      />

      {/* Same width and gutters as the project and plan pages — without this
          wrapper the plan grid ran edge to edge. */}
      <div className="project-page-content">
        <ProjectStatsChips project={project} />

        <PlansAndHomesSection project={project} />

        <StatsContactCard project={project} developer={developer} />

        <SimilarListingsSection listings={similarListings} />
      </div>
    </div>
  );
}

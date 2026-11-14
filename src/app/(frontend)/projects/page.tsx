import type { Metadata } from "next";
import { getAllProjects } from "@/lib/project-store";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import { withSocial } from "@/lib/seo";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

// Targets "property for sale sri lanka" (1,900/mo) and "apartments for sale sri lanka" (1,300/mo), 2026-11-11 (owner request); the count is live.
export async function generateMetadata(): Promise<Metadata> {
  const count = (await getAllProjects()).length;
  const title = `Property for Sale in Sri Lanka: ${count} New Projects`;
  const description = `Property for sale in Sri Lanka: ${count} new apartment, condominium, house and villa projects from developers, with prices, floor plans, photos and locations. Enquire direct, no agent.`;
  return withSocial({
    title,
    description,
    alternates: { canonical: "/projects" },
    openGraph: { title, description, url: "/projects", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  }, { path: "/projects" });
}

type ProjectsPageProps = { searchParams: Promise<{ type?: string; location?: string }> };

function matchesLocation(project: { location: string; city: string; district: string }, location: string) {
  const needle = location.toLowerCase();
  return (
    (project.location ?? "").toLowerCase().includes(needle) ||
    (project.city ?? "").toLowerCase().includes(needle) ||
    (project.district ?? "").toLowerCase().includes(needle)
  );
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { type, location } = await searchParams;
  const allProjects = await getAllProjects();
  let projects = type ? allProjects.filter((project) => project.type === type) : allProjects;
  projects = location ? projects.filter((project) => matchesLocation(project, location)) : projects;

  const h1 = type && location
    ? `New ${type} projects in ${location}`
    : location
      ? `New projects in ${location}`
      : type
        ? `New ${type} projects in Sri Lanka`
        : "Property & Apartments for Sale in Sri Lanka";

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New Projects" }]}
      h1={h1}
      intro="Browse new condominium, apartment, and housing projects in Sri Lanka. This is the full list of new development projects and ongoing projects across the island — use the category pages below to narrow down by location or property type."
      projects={projects}
      relatedPaths={["/projects/colombo", "/projects/houses-for-sale-in-colombo", "/projects/villas", "/projects/beachfront", "/projects/pre-construction", "/land"]}
      about={{
        title: "About property for sale in Sri Lanka.",
        paragraphs: [
          `LankaNewHomes lists ${allProjects.length} new property projects for sale in Sri Lanka, direct from developers: apartments and condominiums, houses, villas and townhouses, from Colombo to Galle, Kandy and Negombo. Every listing shows the developer, location, status and, where published, the floor plans, sizes and payment plan.`,
          "Browse by place: [apartments in Colombo](/projects/colombo), [houses in Colombo](/projects/houses-for-sale-in-colombo), [Kandy](/projects/houses-for-sale-in-kandy), [Galle](/projects/houses-for-sale-in-galle) and [Negombo](/projects/houses-for-sale-in-negombo). Or by type: [luxury apartments](/projects/luxury), [villas](/projects/villas), [beachfront homes](/projects/beachfront) and [off-plan projects](/projects/pre-construction). Looking for a plot? See [land for sale in Sri Lanka](/land).",
          "Buying from abroad? Read our guides for [foreign buyers](/guides/foreigners-buying-property) and [investment property](/guides/investment-property). Enquiries from any listing go straight to the developer with no agent in between.",
        ],
      }}
      emptyStateText={location ? `No ${type ? `${type.toLowerCase()} ` : ""}projects in ${location} yet — browse all new projects in Sri Lanka below.` : undefined}
    />
  );
}

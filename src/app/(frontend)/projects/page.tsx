import type { Metadata } from "next";
import { getAllProjects } from "@/lib/project-store";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "New Development Projects in Sri Lanka | New Condos & Apartments",
  description: "Browse new condominium and apartment projects in Sri Lanka. Compare ongoing and new construction projects with pricing, locations, and developer details.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "New Development Projects in Sri Lanka",
    description: "Browse new condominium and apartment projects in Sri Lanka. Compare ongoing and new construction projects with pricing, locations, and developer details.",
    url: "/projects",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "New Development Projects in Sri Lanka",
    description: "Browse new condominium and apartment projects in Sri Lanka. Compare ongoing and new construction projects with pricing, locations, and developer details.",
  },
};

type ProjectsPageProps = { searchParams: Promise<{ type?: string; location?: string }> };

function matchesLocation(project: { location: string; city: string; district: string }, location: string) {
  const needle = location.toLowerCase();
  return (
    project.location.toLowerCase().includes(needle) ||
    project.city.toLowerCase().includes(needle) ||
    project.district.toLowerCase().includes(needle)
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
        : "New projects in Sri Lanka";

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New Projects" }]}
      h1={h1}
      intro="Browse new condominium, apartment, and housing projects in Sri Lanka. This is the full list of new development projects and ongoing projects across the island — use the category pages below to narrow down by location or property type."
      projects={projects}
      relatedPaths={["/projects/pre-construction", "/projects/colombo", "/projects/villas", "/projects/beachfront"]}
      emptyStateText={location ? `No ${type ? `${type.toLowerCase()} ` : ""}projects in ${location} yet — browse all new projects in Sri Lanka below.` : undefined}
    />
  );
}

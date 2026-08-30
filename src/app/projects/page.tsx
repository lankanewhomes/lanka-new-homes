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

type ProjectsPageProps = { searchParams: Promise<{ type?: string }> };

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const { type } = await searchParams;
  const allProjects = await getAllProjects();
  const projects = type ? allProjects.filter((project) => project.type === type) : allProjects;

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New Projects" }]}
      h1={type ? `New ${type} Projects in Sri Lanka` : "New Projects in Sri Lanka"}
      intro="Browse new condominium, apartment, and housing projects in Sri Lanka. This is the full list of new development projects and ongoing projects across the island — use the category pages below to narrow down by location or property type."
      projects={projects}
      relatedPaths={["/projects/pre-construction", "/projects/colombo", "/projects/villas", "/projects/beachfront"]}
    />
  );
}

import type { Metadata } from "next";
import { getAllProjects } from "@/lib/project-store";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Search New Developments in Sri Lanka",
  description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Search New Developments in Sri Lanka",
    description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
    url: "/search",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Search New Developments in Sri Lanka",
    description: "Search new apartment and housing developments across Sri Lanka by location, price, and availability.",
  },
};

export default async function SearchPage() {
  const projects = await getAllProjects();

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      h1="Search new developments in Sri Lanka"
      intro="Search new condominium, apartment, and housing projects in Sri Lanka by location, price, and availability — use the search bar and filters below to narrow the results."
      projects={projects}
      basePath="/projects"
      relatedPaths={["/projects/pre-construction", "/projects/colombo", "/projects/villas", "/projects/beachfront"]}
    />
  );
}

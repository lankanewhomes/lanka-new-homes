import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Land for Sale in Sri Lanka",
  description: "Browse land parcels for sale across Sri Lanka, listed by developers, construction companies, and builders — pricing, size, and location for every plot.",
  alternates: {
    canonical: "/land",
  },
  openGraph: {
    title: "Land for Sale in Sri Lanka",
    description: "Browse land parcels for sale across Sri Lanka, listed by developers, construction companies, and builders.",
    url: "/land",
    type: "website",
  },
};

const LAND_FILTER_GROUPS = [
  { label: "For sale", options: ["For sale", "Any"] },
  { label: "Land use", options: ["Any", "Residential", "Commercial", "Agricultural", "Mixed Use"] },
  { label: "Any price", options: ["Any price", "Under Rs. 10M", "Rs. 10M - 30M", "Rs. 30M+"] },
  { label: "Any size", options: ["Any size", "Under 20 perches", "20 - 50 perches", "50+ perches"] },
  { label: "Status", options: ["Any", "Available", "Reserved", "Sold"] },
];

export default async function LandListingPage() {
  const lands = await getAllLands();
  const projects = lands.map(landToProjectShape);

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Land" }]}
      h1="Land for Sale in Sri Lanka"
      intro="Raw land parcels for sale across Sri Lanka, listed by developers, construction companies, and independent builders — separate from new-construction projects."
      projects={projects}
      relatedPaths={[]}
      basePath="/land"
      eyebrow="land listings"
      singularEyebrow="land listing"
      filterGroups={LAND_FILTER_GROUPS}
      emptyStateText="No land listings yet — check back soon."
    />
  );
}

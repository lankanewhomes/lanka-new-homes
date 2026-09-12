import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import type { Land } from "@/types";

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
  { label: "Status", options: ["Any", "Now Selling", "Under Construction", "Nearly Sold Out"] },
];

type LandListingPageProps = { searchParams: Promise<{ landUse?: string; location?: string }> };

function matchesLandLocation(land: Land, location: string) {
  const needle = location.toLowerCase();
  return (
    land.location.toLowerCase().includes(needle) ||
    land.city.toLowerCase().includes(needle) ||
    land.district.toLowerCase().includes(needle)
  );
}

export default async function LandListingPage({ searchParams }: LandListingPageProps) {
  const { landUse, location } = await searchParams;
  const lands = await getAllLands();
  let filteredLands = landUse ? lands.filter((land) => land.landUse.includes(landUse as Land["landUse"][number])) : lands;
  filteredLands = location ? filteredLands.filter((land) => matchesLandLocation(land, location)) : filteredLands;
  const projects = filteredLands.map(landToProjectShape);

  const h1 = location ? `Land for Sale in ${location}` : landUse ? `${landUse} land for sale in Sri Lanka` : "Land for Sale in Sri Lanka";

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Land" }]}
      h1={h1}
      intro="Raw land parcels for sale across Sri Lanka, listed by developers, construction companies, and independent builders — separate from new-construction projects."
      projects={projects}
      relatedPaths={[]}
      basePath="/land"
      eyebrow="land listings"
      singularEyebrow="land listing"
      filterGroups={LAND_FILTER_GROUPS}
      emptyStateText={location ? `No land listings in ${location} yet — browse all land for sale in Sri Lanka below.` : "No land listings yet — check back soon."}
    />
  );
}

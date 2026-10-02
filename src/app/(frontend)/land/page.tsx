import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import Link from "next/link";
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
    (land.location ?? "").toLowerCase().includes(needle) ||
    (land.city ?? "").toLowerCase().includes(needle) ||
    (land.district ?? "").toLowerCase().includes(needle)
  );
}

export default async function LandListingPage({ searchParams }: LandListingPageProps) {
  const { landUse, location } = await searchParams;
  const lands = await getAllLands();
  let filteredLands = landUse ? lands.filter((land) => land.landUse.includes(landUse as Land["landUse"][number])) : lands;
  filteredLands = location ? filteredLands.filter((land) => matchesLandLocation(land, location)) : filteredLands;
  const projects = filteredLands.map(landToProjectShape);

  const h1 = location ? `Land for Sale in ${location}` : landUse ? `${landUse} land for sale in Sri Lanka` : "Land for Sale in Sri Lanka";

  // Owner, 2026-10-02: redesign /land. The filter bar and listing grid stay
  // (the shared marketplace layout /projects uses); contained boxes are added
  // below it, same system as /about and /guides. District counts are live.
  const districtCounts = new Map<string, number>();
  for (const land of lands) {
    const district = (land.district ?? "").trim();
    if (district) districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
  }
  const districts = [...districtCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  return (
    <>
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
    <div className="fdv-page land-page">
      {districts.length > 0 ? (
        <section className="fdv-box fdv-box--sage" id="by-district" aria-label="Land by district">
          <div className="wdx-section-head" data-reveal>
            <h2>Browse land by district.</h2>
            <p>Districts with land listed right now.</p>
          </div>
          <ul className="neighborhoods-chip-list" data-reveal>
            {districts.map(([district, count]) => (
              <li key={district}>
                <Link href={`/land?location=${encodeURIComponent(district)}`}>
                  {district}
                  <span>{count} {count === 1 ? "listing" : "listings"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="fdv-box fdv-box--cream" id="before-you-buy" aria-label="Before you buy land">
        <div className="wdx-section-head" data-reveal>
          <h2>Before you buy land.</h2>
          <p>Four checks worth making on any plot, whoever is selling it.</p>
        </div>
        <div className="fdv-box-grid fdv-box-grid--4" data-reveal>
          <div className="fdv-box-card">
            <h3>Check the title</h3>
            <p>Ask for the deed and have a lawyer confirm the seller owns the land and that it is free of claims.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Check the size and road access</h3>
            <p>Confirm the perches on the plan, the road width and the type of road in front of the plot.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Check utilities</h3>
            <p>Ask about water, electricity and drainage, and whether they are already connected to the plot.</p>
          </div>
          <div className="fdv-box-card">
            <h3>Visit in person</h3>
            <p>Walk the plot and the surrounding area, and check the location against the map on the listing.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--dark guides-howto" aria-label="About land on LankaNewHomes">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>About land on LankaNewHomes.</h2>
            <p>
              Land here is listed by developers, construction companies and independent builders, separate from
              new-construction projects. Each listing shows its size, location and the developer&apos;s own pricing.
            </p>
            <p>Enquiries go straight to the seller, with no agent in between.</p>
          </div>
          <div className="guides-howto-box">
            <h3>Keep exploring</h3>
            <ul>
              <li><Link href="/neighborhoods"><strong>Neighborhood guides</strong><span>Compare the areas where land is for sale.</span></Link></li>
              <li><Link href="/projects"><strong>New projects</strong><span>Apartments, villas and houses.</span></Link></li>
              <li><Link href="/construction-companies"><strong>Construction companies</strong><span>Builders for when you are ready to build.</span></Link></li>
            </ul>
          </div>
        </div>
      </section>
    </div>
    </>
  );
}

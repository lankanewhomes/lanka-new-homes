import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import type { Land } from "@/types";
import { withSocial } from "@/lib/seo";
import { formatLkr } from "@/lib/format";
import { landDistricts } from "@/lib/land-seo-pages";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const count = (await getAllLands()).length;
  const title = count > 0 ? `Land for Sale in Sri Lanka: ${count} Plots & Prices` : "Land for Sale in Sri Lanka: Plots & Prices";
  const description = `Land for sale in Sri Lanka: ${count > 0 ? `${count} plots` : "plots"} from developers and builders in Colombo, Gampaha, Kalutara and more, with price per perch, size in perches and exact location. Enquire direct, no agent.`;
  return withSocial({
    title,
    description,
    alternates: { canonical: "/land" },
    openGraph: { title, description, url: "/land", type: "website" },
  }, { path: "/land" });
}

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

  const priced = lands.filter((l) => (l.pricePerPerchLkrMin ?? 0) > 0);
  const low = priced.length ? Math.min(...priced.map((l) => l.pricePerPerchLkrMin ?? 0)) : 0;
  const high = priced.length ? Math.max(...priced.map((l) => l.pricePerPerchLkrMax ?? l.pricePerPerchLkrMin ?? 0)) : 0;
  const districts = landDistricts(lands);
  const districtLine = districts.length
    ? `Besides Colombo, there is land in ${districts.slice(0, 8).map((d) => `${d.name} (${d.count})`).join(", ")}.`
    : "";
  const about = {
    title: "About buying land for sale in Sri Lanka.",
    paragraphs: [
      `LankaNewHomes lists ${lands.length} land ${lands.length === 1 ? "plot" : "plots"} for sale in Sri Lanka from developers, construction companies and independent builders. ${districtLine} Each listing shows the size in perches, the price and the exact location, and every enquiry goes straight to the seller with no agent in between.`.replace(/\s+/g, " "),
      priced.length ? `Published prices run from ${formatLkr(low)}${high > low ? ` to ${formatLkr(high)}` : ""} per perch across ${priced.length} priced plots. Land in Sri Lanka is sold by the perch (1 perch is about 272 square feet, and 160 perches make 1 acre), so compare plots by price per perch rather than total price.` : "Land in Sri Lanka is sold by the perch (1 perch is about 272 square feet, and 160 perches make 1 acre), so compare plots by price per perch rather than total price.",
      "Before you buy, ask for the deed and the approved survey plan, check the access road width, drainage and utilities, and confirm there are no encumbrances. Our guide, [before buying land in Sri Lanka](/blog/before-buying-land-in-sri-lanka), covers the title check and building approvals. Foreign buyers should also read the rules on land ownership for non-Sri Lankans.",
      "Browse by need: [cheap land for sale in Sri Lanka](/land/cheap-land-for-sale-in-sri-lanka), [best land for sale in Colombo](/land/best-land-for-sale-in-colombo), [1 acre land](/land/1-acre-land-for-sale-in-sri-lanka) or [rural land](/land/rural-land-for-sale-in-sri-lanka).",
    ],
  };

  const h1 = location ? `Land for Sale in ${location}` : landUse ? `${landUse} land for sale in Sri Lanka` : "Land for Sale in Sri Lanka";

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Land" }]}
      h1={h1}
      intro={`Land for sale in Sri Lanka: ${lands.length} plots from developers, construction companies and independent builders, with price per perch, size and exact location.`}
      about={about}
      projects={projects}
      relatedPaths={["/land/cheap-land-for-sale-in-sri-lanka", "/land/best-land-for-sale-in-colombo", "/land/1-acre-land-for-sale-in-sri-lanka", "/land/rural-land-for-sale-in-sri-lanka"]}
      basePath="/land"
      eyebrow="land listings"
      singularEyebrow="land listing"
      filterGroups={LAND_FILTER_GROUPS}
      emptyStateText={location ? `No land listings in ${location} yet — browse all land for sale in Sri Lanka below.` : "No land listings yet — check back soon."}
    />
  );
}

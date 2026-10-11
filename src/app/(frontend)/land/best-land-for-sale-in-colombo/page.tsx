import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import { withSocial } from "@/lib/seo";
import type { Land } from "@/types";

// SEO page for "best land for sale in Colombo" (owner, 2026-10-11). Lists every land plot in the Colombo district and writes the
// about text from the live data (counts and the areas with the most plots), so it never goes stale.
export const revalidate = 60;

const PATH = "/land/best-land-for-sale-in-colombo";
const TITLE = "Best Land for Sale in Colombo";
const DESCRIPTION = "Browse the best land for sale in the Colombo district: residential plots from developers and builders in Homagama, Athurugiriya, Malabe, Piliyandala and more, with prices, sizes in perches and locations.";

export const metadata: Metadata = withSocial({ title: TITLE, description: DESCRIPTION, alternates: { canonical: PATH } }, { path: PATH });

const LAND_FILTER_GROUPS = [
  { label: "For sale", options: ["For sale", "Any"] },
  { label: "Land use", options: ["Any", "Residential", "Commercial", "Agricultural", "Mixed Use"] },
  { label: "Any price", options: ["Any price", "Under Rs. 10M", "Rs. 10M - 30M", "Rs. 30M+"] },
  { label: "Any size", options: ["Any size", "Under 20 perches", "20 - 50 perches", "50+ perches"] },
  { label: "Status", options: ["Any", "Now Selling", "Under Construction", "Nearly Sold Out"] },
];

const inColombo = (land: Land) => (land.district ?? "").toLowerCase() === "colombo" || /colombo/i.test(`${land.city ?? ""} ${land.location ?? ""}`);

export default async function BestLandInColomboPage() {
  const colomboLands = (await getAllLands()).filter(inColombo);
  const projects = colomboLands.map(landToProjectShape);

  const counts = new Map<string, number>();
  for (const land of colomboLands) {
    const area = (land.city ?? "").trim();
    if (area && !/^colombo$/i.test(area)) counts.set(area, (counts.get(area) ?? 0) + 1);
  }
  const topAreas = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const areaList = topAreas.map(([area, count]) => `${area} (${count})`).join(", ");

  const paragraphs = [
    colomboLands.length > 0
      ? `This page lists the ${colomboLands.length} land plots for sale in the Colombo district on LankaNewHomes, from developers, construction companies and independent builders.${areaList ? ` Most are outside the city centre, in areas such as ${areaList}, where residential plots are laid out in gated or planned blocks.` : ""} Each listing shows the price, the size in perches, the location and who is selling.`
      : "Land plots for sale in the Colombo district will appear here as developers and builders list them.",
    "The best plot is the one that suits how you will use it. Compare the price per perch against nearby plots, check how wide and how close the access road is, ask about drainage and flooding in the rainy season, and confirm that water, electricity and internet reach the boundary. Ask for the title deed and the survey plan before you pay a deposit, and have a lawyer read the sale agreement.",
    "Listing on LankaNewHomes is free for sellers, and an enquiry from any plot goes straight to the developer or builder with no agent in between. To build on a plot you buy, see our directory of construction companies.",
  ];

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Land", href: "/land" }, { label: TITLE }]}
      h1={TITLE}
      intro="Residential and other land plots for sale in the Colombo district, listed by developers and builders, with prices, sizes in perches and exact locations."
      projects={projects}
      relatedPaths={["/land", "/construction-companies", "/projects/colombo"]}
      basePath="/land"
      eyebrow="land listings"
      singularEyebrow="land listing"
      filterGroups={LAND_FILTER_GROUPS}
      emptyStateText="No land listings in Colombo yet. Browse all land for sale in Sri Lanka."
      about={{ title: "About land for sale in Colombo.", paragraphs }}
    />
  );
}

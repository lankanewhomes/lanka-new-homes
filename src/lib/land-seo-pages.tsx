import type { Metadata } from "next";
import { getAllLands } from "@/lib/land-store";
import { landToProjectShape } from "@/lib/land-to-project";
import { formatLkr } from "@/lib/format";
import { withSocial } from "@/lib/seo";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import type { Land } from "@/types";

// Keyword landing pages for land searches (owner, 2026-10-11): "cheap land for sale sri lanka", "1 acre land (price) in sri lanka",
// "rural land for sale in sri lanka" and "farm land for sale in sri lanka". Every page lists the real land plots that fit and writes its
// text from the live data (counts, lowest and highest published prices per perch), so it never goes stale and never states a market
// price nobody published. A page with no plots yet says so honestly and asks search engines not to index it until it has some.

const PERCHES_PER_ACRE = 160;
const WESTERN = ["colombo", "gampaha", "kalutara"];

const LAND_FILTER_GROUPS = [
  { label: "For sale", options: ["For sale", "Any"] },
  { label: "Land use", options: ["Any", "Residential", "Commercial", "Agricultural", "Mixed Use"] },
  { label: "Any price", options: ["Any price", "Under Rs. 10M", "Rs. 10M - 30M", "Rs. 30M+"] },
  { label: "Any size", options: ["Any size", "Under 20 perches", "20 - 50 perches", "50+ perches"] },
  { label: "Status", options: ["Any", "Now Selling", "Under Construction", "Nearly Sold Out"] },
];

const perPerchLow = (land: Land) => land.pricePerPerchLkrMin ?? 0;
const perPerchHigh = (land: Land) => land.pricePerPerchLkrMax ?? land.pricePerPerchLkrMin ?? 0;
const largestPerches = (land: Land) => land.landSizePerchesMax ?? land.landSizePerches ?? 0;
const isAcreScale = (land: Land) => largestPerches(land) >= PERCHES_PER_ACRE || (land.landSizeAcres ?? 0) >= 1;
const isOutsideWestern = (land: Land) => !WESTERN.includes((land.district ?? "").toLowerCase());
const isFarm = (land: Land) =>
  (land.landUse ?? []).includes("Agricultural") || /farm|agricultur|cultivat|coconut|paddy|plantation|rubber|tea estate/i.test(`${land.title} ${land.landType ?? ""}`);

function districtPriceSentence(lands: Land[], limit = 6) {
  const by = new Map<string, Land[]>();
  for (const land of lands) if (perPerchLow(land) > 0 && land.district) by.set(land.district, [...(by.get(land.district) ?? []), land]);
  return [...by.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, limit)
    .map(([district, list]) => {
      const low = Math.min(...list.map(perPerchLow));
      const high = Math.max(...list.map(perPerchHigh));
      return `${district}: ${low === high ? formatLkr(low) : `${formatLkr(low)} to ${formatLkr(high)}`} per perch (${list.length} ${list.length === 1 ? "plot" : "plots"})`;
    })
    .join("; ");
}

type PageDef = {
  path: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  aboutTitle: string;
  emptyText: string;
  relatedPaths: string[];
  select: (lands: Land[]) => Land[];
  paragraphs: (picked: Land[], all: Land[]) => string[];
};

const ABOUT_FOOT = "Listing on LankaNewHomes is free for sellers, and an enquiry from any plot goes straight to the developer or builder with no agent in between.";
const CHECKS = "Whatever the price, ask for the deed and the approved survey plan, check how wide the access road is, and find out about drainage, flooding in the rainy season and utilities (water, electricity, internet) before you commit. Our short guide, [before buying land in Sri Lanka](/blog/before-buying-land-in-sri-lanka), covers the title check and building approvals.";

export const LAND_SEO_PAGES: Record<string, PageDef> = {
  cheap: {
    path: "/land/cheap-land-for-sale-in-sri-lanka",
    title: "Cheap Land for Sale in Sri Lanka",
    h1: "Cheap Land for Sale in Sri Lanka",
    description: "Cheap land for sale in Sri Lanka: the lowest-priced plots on LankaNewHomes ranked by price per perch, from developers and builders, with sizes in perches and exact locations.",
    intro: "The lowest-priced land plots for sale in Sri Lanka, ranked by price per perch and listed by developers and builders, with sizes in perches and exact locations.",
    aboutTitle: "About cheap land for sale in Sri Lanka.",
    emptyText: "No priced land listings yet. Browse all land for sale in Sri Lanka.",
    relatedPaths: ["/land", "/land/rural-land-for-sale-in-sri-lanka", "/land/1-acre-land-for-sale-in-sri-lanka"],
    select: (lands) => lands.filter((l) => perPerchLow(l) > 0).sort((a, b) => perPerchLow(a) - perPerchLow(b)).slice(0, 60),
    paragraphs: (picked, all) => {
      const priced = all.filter((l) => perPerchLow(l) > 0);
      const first = picked[0];
      return [
        picked.length
          ? `This page shows the ${picked.length} lowest-priced land plots on LankaNewHomes, ranked by the price per perch the seller publishes. The lowest starts at ${formatLkr(perPerchLow(first))} per perch (${first.title}, ${first.district}), out of ${priced.length} plots with a published per-perch price.`
          : "Land plots with a published price per perch will appear here as developers and builders list them.",
        priced.length ? `Published prices per perch by district: ${districtPriceSentence(priced)}.` : "",
        `Cheap land is usually cheaper for a reason: it can be further from a main town, on a narrower road or in an area still being developed. Compare the price per perch against plots nearby rather than the total price, because plot sizes differ. ${CHECKS}`,
        ABOUT_FOOT,
      ].filter(Boolean);
    },
  },
  acre: {
    path: "/land/1-acre-land-for-sale-in-sri-lanka",
    title: "1 Acre Land for Sale in Sri Lanka",
    h1: "1 Acre Land for Sale in Sri Lanka: Prices and Listings",
    description: "1 acre land for sale in Sri Lanka and what it costs: 1 acre is 160 perches. See acre-size plots and the published price per perch by district on LankaNewHomes.",
    intro: "Land for sale in Sri Lanka that is one acre (160 perches) or larger, with a guide to how a 1 acre land price is worked out from the price per perch.",
    aboutTitle: "1 acre land price in Sri Lanka.",
    emptyText: "No acre-size land listings yet. Browse all land for sale in Sri Lanka.",
    relatedPaths: ["/land", "/land/cheap-land-for-sale-in-sri-lanka", "/land/rural-land-for-sale-in-sri-lanka"],
    select: (lands) => lands.filter(isAcreScale).sort((a, b) => largestPerches(b) - largestPerches(a)),
    paragraphs: (picked, all) => {
      const priced = all.filter((l) => perPerchLow(l) > 0);
      return [
        "Land in Sri Lanka is sold by the perch. 1 acre is 160 perches, which is 43,560 square feet or about 4,047 square metres, and 1 hectare is about 395 perches. A 1 acre land price is therefore the price per perch multiplied by 160.",
        picked.length
          ? `${picked.length === 1 ? "One listing here is" : `${picked.length} listings here are`} acre-size or larger on LankaNewHomes: ${picked.map((l) => `${l.title} (${l.district}, up to ${largestPerches(l)} perches)`).join("; ")}.`
          : "Acre-size listings will appear here as developers and sellers list them. Most land on LankaNewHomes today is sold as subdivided residential plots of a few perches to a few dozen perches.",
        priced.length ? `For a sense of the price per perch, these are the published prices on LankaNewHomes by district: ${districtPriceSentence(priced)}. They are for the plots listed here, so they are a guide to the market, not a quote for a particular acre. Multiply the price per perch of the plot you are looking at by 160 to see what an acre there would cost.` : "",
        `Large blocks are priced very differently from small plots: the price per perch depends on the location, the road frontage, how the land is used (residential, agricultural or commercial) and whether it can be subdivided. ${CHECKS}`,
        ABOUT_FOOT,
      ].filter(Boolean);
    },
  },
  rural: {
    path: "/land/rural-land-for-sale-in-sri-lanka",
    title: "Rural Land for Sale in Sri Lanka",
    h1: "Rural Land for Sale in Sri Lanka",
    description: "Rural land for sale in Sri Lanka outside the Colombo region: plots in Kandy, Galle, Kurunegala, Anuradhapura, Nuwara Eliya and more, with prices per perch and locations.",
    intro: "Land plots for sale outside the Colombo region, in the districts beyond the Western Province, listed by developers and builders with prices and sizes in perches.",
    aboutTitle: "About rural land for sale in Sri Lanka.",
    emptyText: "No land listings outside the Colombo region yet. Browse all land for sale in Sri Lanka.",
    relatedPaths: ["/land", "/land/cheap-land-for-sale-in-sri-lanka", "/land/farm-land-for-sale-in-sri-lanka"],
    select: (lands) => lands.filter(isOutsideWestern).sort((a, b) => (perPerchLow(a) || Infinity) - (perPerchLow(b) || Infinity)),
    paragraphs: (picked) => {
      const districts = [...new Set(picked.map((l) => l.district).filter(Boolean))];
      return [
        picked.length
          ? `This page lists the ${picked.length} land plots on LankaNewHomes outside the Colombo, Gampaha and Kalutara districts, in ${districts.length} districts: ${districts.join(", ")}.`
          : "Land plots outside the Colombo region will appear here as developers and builders list them.",
        districtPriceSentence(picked) ? `Published prices per perch: ${districtPriceSentence(picked, 8)}.` : "",
        `Land away from Colombo is generally sold at lower prices per perch, but access matters more: check the condition and width of the road, the distance to the nearest town, hospital and school, and whether water and electricity reach the plot. ${CHECKS}`,
        ABOUT_FOOT,
      ].filter(Boolean);
    },
  },
  farm: {
    path: "/land/farm-land-for-sale-in-sri-lanka",
    title: "Farm Land for Sale in Sri Lanka",
    h1: "Farm Land for Sale in Sri Lanka",
    description: "Farm and agricultural land for sale in Sri Lanka: coconut, paddy, tea and other cultivation land with sizes in perches and acres, prices and locations.",
    intro: "Agricultural and farm land for sale in Sri Lanka, with sizes in perches and acres, prices and exact locations.",
    aboutTitle: "About farm land for sale in Sri Lanka.",
    emptyText: "No farm land listed yet. Browse land for sale outside the Colombo region.",
    relatedPaths: ["/land/rural-land-for-sale-in-sri-lanka", "/land/1-acre-land-for-sale-in-sri-lanka", "/land"],
    select: (lands) => lands.filter(isFarm),
    paragraphs: (picked) => [
      picked.length
        ? `This page lists the ${picked.length} agricultural and farm land plots for sale on LankaNewHomes.`
        : "There is no farm or agricultural land on LankaNewHomes yet. Sellers of agricultural land can list it free, and it will appear here. In the meantime, land outside the Colombo region is on our rural land page.",
      "Land in Sri Lanka is measured in perches and acres: 1 acre is 160 perches. For farm land, ask what the land is currently used for (paddy, coconut, tea, rubber, vegetables), whether it has a water source and irrigation, and whether the deed allows the use you plan.",
      CHECKS,
      ABOUT_FOOT,
    ],
  },
};

export async function landSeoMetadata(key: string): Promise<Metadata> {
  const def = LAND_SEO_PAGES[key];
  const picked = def.select(await getAllLands());
  const meta = withSocial({ title: def.title, description: def.description, alternates: { canonical: def.path } }, { path: def.path });
  // Keep a page with no listings out of search results until it has some.
  return picked.length ? meta : { ...meta, robots: { index: false, follow: true } };
}

export async function LandSeoPage({ pageKey }: { pageKey: string }) {
  const def = LAND_SEO_PAGES[pageKey];
  const all = await getAllLands();
  const picked = def.select(all);
  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Land", href: "/land" }, { label: def.title }]}
      h1={def.h1}
      intro={def.intro}
      projects={picked.map(landToProjectShape)}
      relatedPaths={def.relatedPaths}
      basePath="/land"
      eyebrow="land listings"
      singularEyebrow="land listing"
      filterGroups={LAND_FILTER_GROUPS}
      emptyStateText={def.emptyText}
      about={{ title: def.aboutTitle, paragraphs: def.paragraphs(picked, all) }}
    />
  );
}

export async function landSeoHasListings(key: string) {
  return LAND_SEO_PAGES[key].select(await getAllLands()).length > 0;
}

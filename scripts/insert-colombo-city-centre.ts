// One-time: inserts Colombo City Centre Residencies (project + 2 developers)
// into Supabase. Run with: npx tsx scripts/insert-colombo-city-centre.ts
// Safe to re-run: createDeveloper/createProject check for existing slugs first.
//
// The per-unit CSV below is retained only to derive each floor plan type's
// starting availability (buildFloorPlans) — the app no longer has a `units`
// table, so unit rows are not written to Supabase.

import path from "node:path";
import { config } from "dotenv";
import type { Amenity, FloorPlan, KeyFeatureCategory, NearbyPlace, Project } from "../src/types";

type SeedUnit = {
  unitNumber: string;
  floor: number;
  apartmentType: string;
  bedrooms: number;
  areaSqFt: number;
  priceLkr: number;
  priceUsd: number;
  status: "Available" | "Reserved" | "Booked" | "Sold";
};

config({ path: path.join(process.cwd(), ".env.local") });

const BUILDER_LOGO = "https://s3.us-east-2.amazonaws.com/glovhz/builder/CCC-176.png";

const GALLERY: { label: string; image: string }[] = [
  { label: "Exterior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 11-984.jpg" },
  { label: "Exterior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 4-309.jpg" },
  { label: "Exterior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 2-368.jpg" },
  { label: "Exterior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 3-44.jpg" },
  { label: "Interior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 6-621.jpg" },
  { label: "Interior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 7-385.jpg" },
  { label: "Interior", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 5-828.jpg" },
  { label: "Interior", image: "https://dc0pnhvlit6k.cloudfront.net/project/8-891.jpg" },
  { label: "Common Areas", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 12-848.jpg" },
  { label: "Common Areas", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 10-717.jpg" },
  { label: "Common Areas", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 13-227.jpg" },
  { label: "Common Areas", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 9-408.jpg" },
  { label: "Amenities", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 9-394.jpg" },
  { label: "Amenities", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 4-703.jpg" },
  { label: "Amenities", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 12-549.jpg" },
  { label: "Amenities", image: "https://s3.us-east-2.amazonaws.com/glovhz/project/Gloveh Colombo City Center 13-651.jpg" },
  { label: "Breathtaking Views — Morning, North", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/mor--801.jpg" },
  { label: "Breathtaking Views — Morning, East", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/mor-2-371.jpg" },
  { label: "Breathtaking Views — Morning, West", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/mor-4-546.jpg" },
  { label: "Breathtaking Views — Morning, South", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/mor-3-966.jpg" },
  { label: "Breathtaking Views — Sunset, North", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/sun-1-1.jpg" },
  { label: "Breathtaking Views — Sunset, East", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/sun-2-410.jpg" },
  { label: "Breathtaking Views — Sunset, West", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/sun-4-794.jpg" },
  { label: "Breathtaking Views — Sunset, South", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/sun-3-927.jpg" },
  { label: "Breathtaking Views — Evening, North", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/eve-1-723.jpg" },
  { label: "Breathtaking Views — Evening, East", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/eve-2-803.jpg" },
  { label: "Breathtaking Views — Evening, West", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/eve-4-887.jpg" },
  { label: "Breathtaking Views — Evening, South", image: "https://s3.us-east-2.amazonaws.com/glov/towerview/eve-3-67.jpg" },
];

// No floor-plan line-drawing diagrams were supplied (only photography) — use
// the site's existing Unsplash placeholder pattern until real diagrams land.
const FLOORPLAN_PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=2600&auto=format&fit=crop";

// unit_type -> [bedrooms, sqft, priceLkr, priceUsd]. Bathrooms are not in
// the source data — inferred as bedrooms-count (common convention for this
// unit size range) and flagged in the summary, not asserted as fact.
const UNIT_TYPES: Record<string, { bedrooms: number; sqft: number; priceLkr: number; priceUsd: number }> = {
  "A-3": { bedrooms: 2, sqft: 1126, priceLkr: 87386608, priceUsd: 436933 },
  "F-5": { bedrooms: 2, sqft: 1249, priceLkr: 95533512, priceUsd: 477668 },
  "B1-6": { bedrooms: 2, sqft: 973, priceLkr: 80749270, priceUsd: 403746 },
  "B-2": { bedrooms: 2, sqft: 986, priceLkr: 83584206, priceUsd: 417921 },
  "C-4": { bedrooms: 2, sqft: 1302, priceLkr: 104753712, priceUsd: 523769 },
  "D-1": { bedrooms: 3, sqft: 1654, priceLkr: 149946678, priceUsd: 749733 },
  "E-7": { bedrooms: 3, sqft: 2118, priceLkr: 196052670, priceUsd: 980263 },
};

// floor,unit_type,status,detail_path_suffix (id/plot/sqft) — pasted verbatim from the source CSV (floors 18-42).
const CSV = `
42,A-3,Sold,15/42/30/1126
42,F-5,Available,15/42/31/1249
42,B1-6,Sold,15/42/32/973
42,B-2,Sold,15/42/33/986
42,C-4,Available,15/42/34/1302
42,D-1,Sold,15/42/35/1654
42,E-7,Sold,15/42/36/2118
41,A-3,Booked,15/41/30/1126
41,F-5,Available,15/41/31/1249
41,B1-6,Sold,15/41/32/973
41,B-2,Sold,15/41/33/986
41,C-4,Available,15/41/34/1302
41,D-1,Booked,15/41/35/1654
41,E-7,Sold,15/41/36/2118
40,A-3,Sold,15/40/30/1126
40,F-5,Sold,15/40/31/1249
40,B1-6,Sold,15/40/32/973
40,B-2,Sold,15/40/33/986
40,C-4,Available,15/40/34/1302
40,D-1,Sold,15/40/35/1654
40,E-7,Sold,15/40/36/2118
39,A-3,Available,15/39/30/1126
39,F-5,Available,15/39/31/1249
39,B1-6,Sold,15/39/32/973
39,B-2,Sold,15/39/33/986
39,C-4,Available,15/39/34/1302
39,D-1,Sold,15/39/35/1654
39,E-7,Booked,15/39/36/2118
38,A-3,Available,15/38/30/1126
38,F-5,Sold,15/38/31/1249
38,B1-6,Sold,15/38/32/973
38,B-2,Sold,15/38/33/986
38,C-4,Available,15/38/34/1302
38,D-1,Sold,15/38/35/1654
38,E-7,Sold,15/38/36/2118
37,A-3,Available,15/37/30/1126
37,F-5,Available,15/37/31/1249
37,B1-6,Sold,15/37/32/973
37,B-2,Sold,15/37/33/986
37,C-4,Available,15/37/34/1302
37,D-1,Sold,15/37/35/1654
37,E-7,Sold,15/37/36/2118
36,A-3,Booked,15/36/30/1126
36,F-5,Booked,15/36/31/1249
36,B1-6,Sold,15/36/32/973
36,B-2,Sold,15/36/33/986
36,C-4,Available,15/36/34/1302
36,D-1,Sold,15/36/35/1654
36,E-7,Booked,15/36/36/2118
35,A-3,Sold,15/35/30/1126
35,F-5,Sold,15/35/31/1249
35,B1-6,Sold,15/35/32/973
35,B-2,Sold,15/35/33/986
35,C-4,Booked,15/35/34/1302
35,D-1,Sold,15/35/35/1654
35,E-7,Sold,15/35/36/2118
34,A-3,Sold,15/34/30/1126
34,F-5,Available,15/34/31/1249
34,B1-6,Sold,15/34/32/973
34,B-2,Sold,15/34/33/986
34,C-4,Available,15/34/34/1302
34,D-1,Booked,15/34/35/1654
34,E-7,Sold,15/34/36/2118
33,A-3,Sold,15/33/30/1126
33,F-5,Sold,15/33/31/1249
33,B1-6,Sold,15/33/32/973
33,B-2,Sold,15/33/33/986
33,C-4,Sold,15/33/34/1302
33,D-1,Sold,15/33/35/1654
33,E-7,Available,15/33/36/2118
32,A-3,Sold,15/32/30/1126
32,F-5,Sold,15/32/31/1249
32,B1-6,Sold,15/32/32/973
32,B-2,Sold,15/32/33/986
32,C-4,Sold,15/32/34/1302
32,D-1,Sold,15/32/35/1654
32,E-7,Booked,15/32/36/2118
31,A-3,Sold,15/31/30/1126
31,F-5,Sold,15/31/31/1249
31,B1-6,Sold,15/31/32/973
31,B-2,Sold,15/31/33/986
31,C-4,Sold,15/31/34/1302
31,D-1,Sold,15/31/35/1654
31,E-7,Booked,15/31/36/2118
30,A-3,Sold,15/30/30/1126
30,F-5,Booked,15/30/31/1249
30,B1-6,Sold,15/30/32/973
30,B-2,Sold,15/30/33/986
30,C-4,Sold,15/30/34/1302
30,D-1,Available,15/30/35/1654
30,E-7,Sold,15/30/36/2118
29,A-3,Sold,15/29/30/1126
29,F-5,Sold,15/29/31/1249
29,B1-6,Sold,15/29/32/973
29,B-2,Sold,15/29/33/986
29,C-4,Sold,15/29/34/1302
29,D-1,Sold,15/29/35/1654
29,E-7,Sold,15/29/36/2118
28,A-3,Sold,15/28/30/1126
28,F-5,Sold,15/28/31/1249
28,B1-6,Sold,15/28/32/973
28,B-2,Sold,15/28/33/986
28,C-4,Sold,15/28/34/1302
28,D-1,Sold,15/28/35/1654
28,E-7,Sold,15/28/36/2118
27,A-3,Sold,15/27/30/1126
27,F-5,Sold,15/27/31/1249
27,B1-6,Sold,15/27/32/973
27,B-2,Sold,15/27/33/986
27,C-4,Sold,15/27/34/1302
27,D-1,Sold,15/27/35/1654
27,E-7,Sold,15/27/36/2118
26,A-3,Sold,15/26/30/1126
26,F-5,Sold,15/26/31/1249
26,B1-6,Sold,15/26/32/973
26,B-2,Booked,15/26/33/986
26,C-4,Sold,15/26/34/1302
26,D-1,Sold,15/26/35/1654
26,E-7,Sold,15/26/36/2118
25,A-3,Sold,15/25/30/1126
25,F-5,Sold,15/25/31/1249
25,B1-6,Sold,15/25/32/973
25,B-2,Sold,15/25/33/986
25,C-4,Sold,15/25/34/1302
25,D-1,Sold,15/25/35/1654
25,E-7,Sold,15/25/36/2118
24,A-3,Sold,15/24/30/1126
24,F-5,Sold,15/24/31/1249
24,B1-6,Sold,15/24/32/973
24,B-2,Sold,15/24/33/986
24,C-4,Sold,15/24/34/1302
24,D-1,Sold,15/24/35/1654
24,E-7,Sold,15/24/36/2118
23,A-3,Sold,15/23/30/1126
23,F-5,Sold,15/23/31/1249
23,B1-6,Sold,15/23/32/973
23,B-2,Available,15/23/33/986
23,C-4,Sold,15/23/34/1302
23,D-1,Sold,15/23/35/1654
23,E-7,Sold,15/23/36/2118
22,A-3,Sold,15/22/30/1126
22,F-5,Sold,15/22/31/1249
22,B1-6,Sold,15/22/32/973
22,B-2,Booked,15/22/33/986
22,C-4,Sold,15/22/34/1302
22,D-1,Sold,15/22/35/1654
22,E-7,Sold,15/22/36/2118
21,A-3,Sold,15/21/30/1126
21,F-5,Sold,15/21/31/1249
21,B1-6,Sold,15/21/32/973
21,B-2,Available,15/21/33/986
21,C-4,Sold,15/21/34/1302
21,D-1,Sold,15/21/35/1654
21,E-7,Sold,15/21/36/2118
20,A-3,Sold,15/20/30/1126
20,F-5,Sold,15/20/31/1249
20,B1-6,Sold,15/20/32/973
20,B-2,Sold,15/20/33/986
20,C-4,Sold,15/20/34/1302
20,D-1,Sold,15/20/35/1654
20,E-7,Sold,15/20/36/2118
19,A-3,Sold,15/19/30/1126
19,F-5,Sold,15/19/31/1249
19,B1-6,Sold,15/19/32/973
19,B-2,Booked,15/19/33/986
19,C-4,Booked,15/19/34/1302
19,D-1,Booked,15/19/35/1654
19,E-7,Sold,15/19/36/2118
18,A-3,Booked,15/18/30/1126
18,F-5,Sold,15/18/31/1249
18,B1-6,Sold,15/18/32/973
18,B-2,Sold,15/18/33/986
18,C-4,Sold,15/18/34/1302
18,D-1,Sold,15/18/35/1654
18,E-7,Sold,15/18/36/2118
`.trim();

function buildUnits(): SeedUnit[] {
  const rows = CSV.split("\n").map((line) => line.trim()).filter(Boolean);
  return rows.map((line) => {
    const [floorStr, unitType, status] = line.split(",");
    const spec = UNIT_TYPES[unitType];
    if (!spec) throw new Error(`Unknown unit type ${unitType}`);
    const floor = Number(floorStr);
    return {
      unitNumber: `${floor}-${unitType}`,
      floor,
      apartmentType: unitType,
      bedrooms: spec.bedrooms,
      areaSqFt: spec.sqft,
      priceLkr: spec.priceLkr,
      priceUsd: spec.priceUsd,
      status: status as SeedUnit["status"],
    };
  });
}

function availabilityForType(units: SeedUnit[], unitType: string): FloorPlan["availability"] {
  const ofType = units.filter((unit) => unit.apartmentType === unitType);
  const available = ofType.filter((unit) => unit.status === "Available").length;
  if (available === 0) return "Sold Out";
  if (available <= 3) return "Limited";
  return "Available";
}

function buildFloorPlans(units: SeedUnit[]): FloorPlan[] {
  return Object.entries(UNIT_TYPES).map(([code, spec]) => ({
    id: `ccc-${code.toLowerCase()}`,
    planName: `Type ${code} (${spec.bedrooms}BR)`,
    planType: code,
    bedrooms: spec.bedrooms,
    bathrooms: spec.bedrooms, // not in source data — inferred, see script header comment
    floorAreaSqFt: spec.sqft,
    startingPriceLkr: spec.priceLkr,
    image: FLOORPLAN_PLACEHOLDER_IMAGE,
    availability: availabilityForType(units, code),
  }));
}

const AMENITIES: Amenity["name"][] = ["Infinity Pool", "Games Room", "Gym", "Sky Lounge", "Retail Mall", "Hotel"];

// "Label: Value" pairs, rendered as flat text (not pill badges) in the Key
// Features accordion — each maps 1:1 to a fact given in the brief.
const UNIT_FEATURES: KeyFeatureCategory[] = [
  {
    key: "indoor",
    label: "Indoor Features",
    items: [
      { field: "Kitchen", value: "Pantry cabinets" },
      { field: "Storage", value: "Built-in wardrobes" },
      { field: "Bathroom", value: "Premium fixtures" },
      { field: "Windows", value: "Double-glazed glass" },
      { field: "Climate", value: "Air conditioning" },
      { field: "Lighting", value: "Fixtures included" },
      { field: "Security", value: "Video phone" },
      { field: "Connectivity", value: "Internet access" },
      { field: "Laundry", value: "Complete in-unit" },
      { field: "Storage", value: "Walk-in closets" },
      { field: "Appliances", value: "Top-of-the-line kitchen" },
      { field: "Flooring", value: "Hardwood" },
    ],
  },
  {
    key: "outdoor",
    label: "Outdoor Features",
    items: [{ field: "Balcony", value: "Terrace included" }],
  },
];

const NEARBY: NearbyPlace[] = [
  { category: "Landmark", name: "Cinnamon Grand Hotel", distanceKm: 1 },
  { category: "Transport", name: "Fort Station", distanceKm: 4 },
  { category: "School", name: "Bishops College", distanceKm: 0.4 },
  { category: "Landmark", name: "United States Embassy", distanceKm: 1.5 },
  { category: "Hospital", name: "Nawaloka Hospital", distanceKm: 0.4 },
  { category: "Landmark", name: "Sampath Bank Head Office", distanceKm: 0.5 },
  { category: "Landmark", name: "Dinemore Hotel", distanceKm: 0.3 },
  { category: "Landmark", name: "Kollupitiya Police Station", distanceKm: 1.4 },
  { category: "Shopping", name: "Arpico Super Centre", distanceKm: 0.8 },
];

type DeveloperStore = typeof import("../src/lib/developer-store");

async function ensureDeveloper(store: DeveloperStore, input: {
  slug: string;
  name: string;
  location: string;
}) {
  const { getDeveloperBySlug, createDeveloper } = store;
  const existing = await getDeveloperBySlug(input.slug);
  if (existing) {
    console.log(`Developer ${input.slug} already exists — skipping create.`);
    return existing;
  }

  // establishedYear/yearsInBusiness/activeProjects/completedProjects/website
  // were not provided in the brief. Using 0/"" placeholders rather than
  // inventing plausible-sounding corporate history for a real company —
  // flagged in the run summary, needs the user's real figures.
  const developer = await createDeveloper({
    name: input.name,
    logo: BUILDER_LOGO,
    description: `${input.name} is a co-developer of Colombo City Centre Residencies, a mixed-use development on Beira Lake in Colombo.`,
    location: input.location,
    establishedYear: 0,
    yearsInBusiness: 0,
    activeProjects: 0,
    completedProjects: 0,
    website: "",
    email: "info@gloveh.com",
    phone: "+94 76 360 7373",
  });
  console.log(`Created developer ${developer.slug}`);
  return developer;
}

type NeighborhoodStore = typeof import("../src/lib/neighborhood-store");

async function ensureNeighborhood(store: NeighborhoodStore, input: { slug: string; name: string; city: string; province: string }) {
  const { getNeighborhoodBySlug, createNeighborhood } = store;
  const existing = await getNeighborhoodBySlug(input.slug);
  if (existing) {
    console.log(`Neighborhood ${input.slug} already exists — skipping create.`);
    return existing;
  }

  // No neighborhood-specific photo was supplied — placeholder until a real one lands.
  const neighborhood = await createNeighborhood({
    name: input.name,
    city: input.city,
    province: input.province,
    description: `${input.name} is a central Colombo neighborhood on the shores of Beira Lake, home to Colombo City Centre Residencies.`,
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=2600&auto=format&fit=crop",
  });
  console.log(`Created neighborhood ${neighborhood.slug}`);
  return neighborhood;
}

async function main() {
  // Dynamic imports: src/lib/supabase.ts reads env vars at module load
  // time, so these store modules must be imported only after config()
  // (above) has already run — a static top-level import would be hoisted
  // ahead of it.
  const developerStore = await import("../src/lib/developer-store");
  const neighborhoodStore = await import("../src/lib/neighborhood-store");
  const { createProject, getProjectBySlug, updateProject } = await import("../src/lib/project-store");

  const nextStoryGroup = await ensureDeveloper(developerStore, { slug: "next-story-group", name: "NEXT Story Group", location: "Singapore" });
  await ensureDeveloper(developerStore, { slug: "abans-group", name: "Abans Group", location: "Colombo, Sri Lanka" });
  const kollupitiya = await ensureNeighborhood(neighborhoodStore, { slug: "kollupitiya", name: "Kollupitiya", city: "Colombo", province: "Western Province" });

  const units = buildUnits();
  const floorPlans = buildFloorPlans(units);

  const projectInput: Partial<Project> & { name: string; developerSlug: string; developerName: string } = {
    slug: "colombo-city-centre-residencies",
    name: "Colombo City Centre Residencies",
    developerSlug: nextStoryGroup.slug,
    developerName: nextStoryGroup.name,
    coDevelopers: [{ name: "Abans Group", href: "/developers/abans-group" }],
    location: "137, Sir James Pieris Mawatha, Colombo 02, Sri Lanka",
    province: "Western Province",
    district: "Colombo",
    city: "Colombo",
    neighborhood: "Kollupitiya",
    neighborhoodSlug: kollupitiya.slug,
    road: "Sir James Pieris Mawatha",
    type: "Condominium",
    status: "Now Selling",
    ownership: "Freehold",
    startingPriceLkr: Math.min(...Object.values(UNIT_TYPES).map((t) => t.priceLkr)),
    priceRange: "Rs. 80,749,270 – Rs. 196,052,670",
    bedrooms: "2-3",
    bathrooms: "2-3", // inferred from bedroom count — not in source data
    floorAreaRange: "973 - 2,118 SqFt",
    units: 192, // per brief; only 175 units (floors 18-42) have unit-level data — see run summary
    floors: 43, // derived from the "43rd-floor sky lounge" amenity; floors 1-17 (mall/hotel/parking) have no unit data
    carparkLevels: 30,
    averageUnitPriceLkr: 75999988,
    averageFloorAreaSqFt: 1302,
    // Weighted mean across all 175 real units (sum(price)/sum(sqft)) — not
    // averageUnitPriceLkr/averageFloorAreaSqFt, which mixes two independent
    // brief stats and produces a figure inconsistent with the per-type
    // economics (real per-type ratios run Rs. 76K-93K/sqft).
    averagePricePerSqft: `Rs. ${Math.round(units.reduce((sum, u) => sum + u.priceLkr, 0) / units.reduce((sum, u) => sum + u.areaSqFt, 0)).toLocaleString()}`,
    parking: "Resident and visitor parking",
    security: "-",
    paymentPlan: "",
    summary: "A mixed-use development on the shores of Beira Lake, next to the Seema Malakaya Temple in central Colombo, combining residences, a lifestyle retail mall, and Asia's first NEXT hotel.",
    description: "Mixed-use development on the shores of Beira Lake, next to the Seema Malakaya Temple in central Colombo. Includes a lifestyle retail mall with local and international brands, world-class dining, and a 200-room NEXT hotel (Asia's first). Two-bedroom residences feature open kitchen/dining/entertaining areas; three-bedroom residences have a spacious entry corridor. All units include a main bathroom/guest powder room, laundry area, and balcony.",
    heroImage: "https://s3.us-east-2.amazonaws.com/glovhz/project/CCC_l-19.jpg",
    gallery: GALLERY,
    contact: {
      name: "Colombo City Centre Residencies Sales",
      email: "info@gloveh.com",
      phone: "+94 76 360 7373",
    },
    // Approximate — Beira Lake / Seema Malakaya Temple area, Colombo 02. Not surveyed to the exact building.
    coordinates: { lat: 6.9185, lng: 79.85 },
    amenities: AMENITIES.map((name) => ({ name, icon: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
    unitFeatures: UNIT_FEATURES,
    floorPlans,
    nearby: NEARBY,
    // Capped at 8 (the wizard's max). Property type, SqFt, Floors, and
    // Ownership are still visible in the project details table below.
    desktopVisibleStats: ["Listing status", "Move in", "Price range", "Total Units", "Units sold", "Units available", "Beds", "Baths"],
  };

  const existingProject = await getProjectBySlug(projectInput.slug!);
  if (existingProject) {
    console.log("Project already exists — updating instead of creating.");
    await updateProject(projectInput.slug!, projectInput);
  } else {
    const created = await createProject(projectInput);
    console.log(`Created project ${created?.slug}`);
  }
}

main().catch((error) => {
  console.error("Insert failed:", error);
  process.exit(1);
});

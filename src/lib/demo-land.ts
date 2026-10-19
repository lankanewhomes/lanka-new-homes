import type { Land, LandPlot, SiteMapLandmark } from "@/types";

// TEST ONLY (owner, 2026-10-19: "make 1 for land, don't publish it, don't apply these effects to other listings"). A made-up land community used by
// /listing-preview/land-demo to show the interactive lot map, phases, a model home with a 360 tour, clubhouse and pool, and one-click viewing
// booking. It lives in code only: it is not in the database, not in the sitemap and not on the public site. Every figure is invented.

type Status = "Available" | "Reserved" | "Sold";

function block(phase: string, x0: number, y0: number, cols: number, rows: number, w: number, h: number, start: number, statuses: Status[]): LandPlot[] {
  const plots: LandPlot[] = [];
  let n = start;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * (w + 6);
      const y = y0 + r * (h + 6);
      const skew = ((n * 7) % 5) - 2; // a little irregularity so it looks like a real layout
      const size = 8 + ((n * 37) % 130) / 10; // 8.0 to 20.9 perches
      const rounded = Math.round(size * 2) / 2;
      plots.push({
        id: `demo-${n}`,
        name: `Lot ${n}`,
        sizePerches: rounded,
        priceLkr: Math.round((rounded * 1_450_000) / 50_000) * 50_000,
        status: statuses[(n * 5) % statuses.length],
        phase,
        shape: `${x},${y} ${x + w},${y + skew} ${x + w},${y + h} ${x},${y + h - skew}`,
      });
      n++;
    }
  }
  return plots;
}

const plots: LandPlot[] = [
  ...block("Phase 1", 70, 70, 5, 3, 62, 50, 1, ["Sold", "Sold", "Sold", "Reserved", "Sold", "Available"]),
  ...block("Phase 2", 470, 70, 5, 3, 62, 50, 16, ["Available", "Sold", "Reserved", "Available", "Available", "Sold"]),
  ...block("Phase 3", 70, 380, 4, 2, 66, 56, 31, ["Available", "Available", "Reserved", "Available"]),
  ...block("Phase 3", 70, 520, 4, 1, 66, 56, 39, ["Available", "Available", "Available", "Reserved"]),
];

const siteMapLandmarks: SiteMapLandmark[] = [
  { kind: "road", label: "Main road", shape: "40,300 960,300 960,340 40,340" },
  { kind: "road", label: "", shape: "380,40 410,40 410,300 380,300" },
  { kind: "gate", label: "Entrance", shape: "430,640 530,640 530,690 430,690" },
  { kind: "road", label: "", shape: "465,340 495,340 495,640 465,640" },
  { kind: "clubhouse", label: "Clubhouse", shape: "560,400 760,400 760,500 560,500" },
  { kind: "pool", label: "Pool", shape: "790,410 930,410 930,490 790,490" },
  { kind: "model-home", label: "Model home", shape: "560,530 650,530 650,600 560,600" },
  { kind: "park", label: "Park", shape: "690,540 930,540 930,620 690,620" },
];

export const DEMO_LAND_SLUG = "land-demo";

export const DEMO_LAND: Land = {
  slug: DEMO_LAND_SLUG,
  title: "DEMO: Lakeview Gardens Residential Lands",
  sellerType: "developer",
  sellerName: "Demo Developer (test)",
  location: "Peradeniya Road, Kandy",
  district: "Kandy",
  city: "Kandy",
  province: "Central",
  landSizePerches: 8,
  landSizePerchesMax: 21,
  priceLkr: 0,
  pricePerPerchLkrMin: 1_350_000,
  pricePerPerchLkrMax: 1_650_000,
  landUse: ["Residential"],
  landType: "Bare land with a clubhouse and pool",
  roadAccess: "20 ft internal roads, tarred",
  roadWidthFt: 20,
  electricity: "Available",
  water: "Available",
  titleType: "Freehold - clear deed",
  surveyPlanStatus: "Approved survey plan",
  paymentPlanItems: ["30% down payment, balance over 18 months interest free"],
  badges: ["Test listing"],
  facilities: ["Gated community", "Tarred internal roads", "Underground power", "Street lighting"],
  amenities: [
    { name: "Clubhouse", icon: "Clubhouse", description: "A community clubhouse with a lounge and a small gym." },
    { name: "Pool", icon: "Pool", description: "A shared swimming pool beside the clubhouse." },
    { name: "Garden", icon: "Garden", description: "A landscaped park in the middle of the community." },
    { name: "Security", icon: "Security", description: "A gated entrance with a security booth." },
  ],
  plots,
  siteMapLandmarks,
  status: "Available",
  summary: "A made-up 42-lot residential community in three phases, with a clubhouse, a pool and a model home you can walk through in 360 degrees. Pick a lot on the map and book a viewing in one click.",
  description: "This is a TEST page used to try the interactive lot map. Every name, figure and lot on it is invented. It is not a real listing and is not published on LankaNewHomes.",
  heroImage: "https://media.lankanewhomes.com/projects/central-park-boulevard-port-city-colombo/gallery/central-park-boulevard-port-city-colombo_aerial-courtyard.jpg",
  gallery: [
    { label: "Community aerial", image: "https://media.lankanewhomes.com/projects/central-park-boulevard-port-city-colombo/gallery/central-park-boulevard-port-city-colombo_aerial-courtyard.jpg" },
    { label: "Pool", image: "https://media.lankanewhomes.com/projects/central-park-boulevard-port-city-colombo/gallery/central-park-boulevard-port-city-colombo_aerial-courtyard-pool.jpg" },
  ],
  // A Street View stand-in for the model home 360 tour.
  view360Url: "https://maps.google.com/maps?q=&layer=c&cbll=7.2556,80.5975&cbp=11,0,0,0,0&output=svembed",
  nearby: [
    { category: "Shopping", name: "Kandy City Centre", distanceKm: 4.5 },
    { category: "Hospital", name: "Kandy General Hospital", distanceKm: 5.2 },
    { category: "School", name: "Trinity College Kandy", distanceKm: 6.1 },
  ],
  coordinates: { lat: 7.2556, lng: 80.5975, streetViewAvailable: true },
  contact: { name: "Demo Developer (test)", email: "demo@lankanewhomes.com", phone: "+94 70 000 0000" },
  seoTitle: "Test listing",
  noIndex: true,
};

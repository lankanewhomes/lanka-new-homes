import type { Land, LandPlot, SiteMapLandmark } from "@/types";
import { lotMapDataUrl } from "@/lib/lot-map-svg";

// TEST ONLY (owner, 2026-10-19: "make 1 for land, don't publish it, don't apply these effects to other listings"). A made-up land community used by
// /listing-preview/land-demo to show the interactive lot map, phases, a model home with a 360 tour, clubhouse and pool, and one-click viewing
// booking. It lives in code only: it is not in the database, not in the sitemap and not on the public site. Every figure is invented.

type Status = "Available" | "Reserved" | "Sold";
type Pt = [number, number];

// A block plan in the style of a printed developer plan: lots laid out along angled roads. Roads are thick segments; lots are quadrilaterals
// placed along one side of a road, with a little deterministic irregularity so the plan does not look machine-made.
const SIZES = [8, 8, 7.5, 9, 7, 6.2, 6.2, 7.7, 6.7, 6.5, 7, 7.2, 7.5, 7.5, 8.6, 8.4, 7.2, 7.5, 6.5, 6.5, 8.9, 6.6, 7.4];

function seg(p0: Pt, p1: Pt, w: number) {
  const dx = p1[0] - p0[0], dy = p1[1] - p0[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const nx = uy, ny = -ux; // normal; +1 side
  const h = w / 2;
  const poly = [[p0[0] + nx * h, p0[1] + ny * h], [p1[0] + nx * h, p1[1] + ny * h], [p1[0] - nx * h, p1[1] - ny * h], [p0[0] - nx * h, p0[1] - ny * h]].map((q) => `${Math.round(q[0])},${Math.round(q[1])}`).join(" ");
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { p0, p1, w, ux, uy, nx, ny, len, poly, angle: angle > 90 ? angle - 180 : angle < -90 ? angle + 180 : angle };
}

type Road = ReturnType<typeof seg>;
function lotsAlong(road: Road, side: 1 | -1, from: number, to: number, count: number, depth: number, startNo: number, phase: string, statuses: Status[], reverse = false): LandPlot[] {
  const list: LandPlot[] = [];
  for (let i = 0; i < count; i++) {
    const t0 = from + ((to - from) * i) / count;
    const t1 = from + ((to - from) * (i + 1)) / count;
    const off = road.w / 2 + 5;
    const wiggle = ((i * 7 + startNo * 3) % 5) - 2;
    const pt = (t: number, d: number): Pt => [road.p0[0] + road.ux * road.len * t + road.nx * side * d, road.p0[1] + road.uy * road.len * t + road.ny * side * d];
    const a = pt(t0, off), b = pt(t1, off), c = pt(t1, off + depth + wiggle * 2), d = pt(t0, off + depth - wiggle * 2);
    list.push({ id: "", name: "", sizePerches: 0, phase, status: statuses[0], shape: [a, b, c, d].map((q) => `${Math.round(q[0])},${Math.round(q[1])}`).join(" ") });
  }
  if (reverse) list.reverse();
  return list.map((l, i) => ({ ...l, name: `Lot ${startNo + i}`, id: `demo-${startNo + i}`, status: statuses[(startNo + i) % statuses.length] }));
}

const roadA = seg([880, 30], [905, 665], 44);
const roadB = seg([495, 215], [880, 200], 34);
const roadC = seg([495, 215], [350, 500], 34);
const roadD = seg([350, 500], [290, 610], 30);
const roadE1 = seg([120, 95], [235, 300], 30);
const roadE2 = seg([235, 300], [110, 470], 30);
const roadF = seg([320, 150], [440, 300], 26);

const P1: Status[] = ["Sold", "Sold", "Sold", "Reserved", "Sold", "Available"];
const P2: Status[] = ["Available", "Sold", "Reserved", "Available", "Available", "Sold"];
const P3: Status[] = ["Available", "Available", "Reserved", "Available"];

const raw: LandPlot[] = [
  ...lotsAlong(roadB, 1, 0.1, 0.96, 4, 92, 1, "Phase 1", P1, true), // 1-4, north of the 22ft road, numbered right to left
  ...lotsAlong(roadA, -1, 0.36, 0.78, 3, 78, 5, "Phase 1", P1), // 5-7, along the main road
  ...lotsAlong(roadA, -1, 0.8, 0.96, 1, 78, 8, "Phase 1", P1), // 8
  ...lotsAlong(roadB, -1, 0.1, 0.56, 2, 68, 9, "Phase 2", P2), // 9-10, south of the 22ft road
  ...lotsAlong(roadC, 1, 0.3, 0.97, 3, 80, 11, "Phase 2", P2), // 11-13 east of the diagonal road
  ...lotsAlong(roadD, 1, 0.08, 0.95, 1, 78, 14, "Phase 2", P2), // 14
  ...lotsAlong(roadD, -1, 0.08, 0.95, 1, 78, 15, "Phase 3", P3), // 15
  ...lotsAlong(roadC, -1, 0.3, 0.97, 3, 84, 16, "Phase 3", P3, true), // 16-18 west of the diagonal road
  ...lotsAlong(roadF, 1, 0.12, 0.62, 1, 66, 19, "Phase 3", P3), // 19
];
const plots: LandPlot[] = raw.map((plot, i) => {
  const size = SIZES[i % SIZES.length];
  return { ...plot, sizePerches: size, priceLkr: Math.round((size * 1_450_000) / 50_000) * 50_000 };
});

const road = (r: Road, label: string): SiteMapLandmark => ({ kind: "road", label, shape: r.poly, angle: r.angle });
const siteMapLandmarks: SiteMapLandmark[] = [
  road(roadA, "Road"), road(roadB, "22ft road"), road(roadC, "22ft road"), road(roadD, "17ft road"), road(roadE1, ""), road(roadE2, ""), road(roadF, "15ft road"),
  { kind: "clubhouse", label: "Clubhouse", shape: "575,395 725,395 725,470 575,470" },
  { kind: "pool", label: "Pool", shape: "575,490 655,490 655,560 575,560" },
  { kind: "model-home", label: "Model home", shape: "670,490 745,490 745,560 670,560" },
  { kind: "park", label: "Park", shape: "575,580 745,580 745,640 575,640" },
  { kind: "gate", label: "Entrance", shape: "930,620 985,620 985,665 930,665" },
  { kind: "tree", label: "", shape: "250,90" }, { kind: "tree", label: "", shape: "165,330" }, { kind: "tree", label: "", shape: "185,355" },
  { kind: "tree", label: "", shape: "950,300" }, { kind: "tree", label: "", shape: "770,330" }, { kind: "tree", label: "", shape: "520,560" }, { kind: "tree", label: "", shape: "425,95" },
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
  summary: "A made-up 19-lot residential community in three phases, with a clubhouse, a pool and a model home you can walk through in 360 degrees. Pick a lot on the map and book a viewing in one click.",
  description: "This is a TEST page used to try the interactive lot map. Every name, figure and lot on it is invented. It is not a real listing and is not published on LankaNewHomes.",
  // The hero shows the numbered block plan (owner, 2026-10-19); the photos sit beside it.
  heroImage: lotMapDataUrl(plots, siteMapLandmarks, "Lakeview Gardens", "Kandy"),
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

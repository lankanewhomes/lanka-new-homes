// Realistic Sri Lankan sample data pools for the mock dashboard. Nothing here is read from a database; every list is invented
// or taken from public company names purely to make the design look real.

export function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export type Rng = () => number;
export const pick = <T,>(rng: Rng, list: readonly T[]): T => list[Math.floor(rng() * list.length)];
export const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;
export const chance = (rng: Rng, p: number) => rng() < p;
export const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** "Today" for the mock data, so dates look current. */
export const NOW = new Date("2026-10-14T10:00:00+05:30");
export const daysAgo = (n: number, rng?: Rng) => new Date(NOW.getTime() - (n + (rng ? rng() : 0)) * 86400000).toISOString();
export const daysAhead = (n: number) => new Date(NOW.getTime() + n * 86400000).toISOString();

export const COUNTS: Record<string, number> = {
  users: 14, developers: 12, projects: 36, lands: 40, "addon-requests": 8, "construction-companies": 10, "marketing-companies": 8,
  "sales-companies": 8, architects: 10, "interior-designers": 8, neighborhoods: 24, "hero-slides": 8, "saved-listings": 20,
  "social-assets": 12, "social-posts": 14, "seo-keywords": 30, "listing-todos": 24, outreach: 6, "mail-accounts": 3, "mail-folders": 9,
  "mail-messages": 24, "mail-sync-state": 6, subscriptions: 9, leads: 80, reviews: 16, analytics: 120, payments: 12,
  "placement-pricing": 10, "plan-waitlist": 8, "team-members": 8, articles: 8, media: 20,
};

export const CITIES = ["Colombo 03", "Colombo 05", "Colombo 07", "Colombo 08", "Colombo 09", "Rajagiriya", "Battaramulla", "Thalawathugoda", "Nugegoda", "Kottawa", "Mount Lavinia", "Dehiwala", "Negombo", "Kandy", "Galle", "Weligama", "Mirissa", "Bentota", "Kadawatha", "Gampaha", "Malabe", "Piliyandala", "Panadura", "Ja-Ela"];

export const DEVELOPERS = [
  { name: "Prime Lands", domain: "primelands.lk", phone: "+94 112 699 822", year: 1993 },
  { name: "Home Lands Skyline", domain: "homelandsskyline.lk", phone: "+94 112 576 700", year: 2004 },
  { name: "Rush Lanka Group", domain: "rushlankagroup.com", phone: "+94 114 506 060", year: 2011 },
  { name: "Fairway Properties", domain: "fairwayproperties.lk", phone: "+94 112 303 700", year: 2008 },
  { name: "Odiliya Homes", domain: "odiliyahomes.lk", phone: "+94 114 366 000", year: 2002 },
  { name: "ICC Port City", domain: "icc-construct.com", phone: "+94 112 300 300", year: 2015 },
  { name: "Capitol Developers", domain: "capitol.lk", phone: "+94 112 686 700", year: 1998 },
  { name: "John Keells Properties", domain: "johnkeellsproperties.com", phone: "+94 112 306 000", year: 1870 },
  { name: "Gangani Land Sales", domain: "ganganilandsales.com", phone: "+94 112 892 233", year: 2006 },
  { name: "Global Housing", domain: "globalgrouplk.com", phone: "+94 112 523 800", year: 2010 },
  { name: "Excello Developers", domain: "excello.lk", phone: "+94 112 304 000", year: 2012 },
  { name: "Provident Capital", domain: "providentcapital.lk", phone: "+94 112 420 420", year: 2009 },
];

export const PROJECTS = [
  "The Golf - Colombo 08", "Mon Vie - Colombo 05", "The Seasons - Colombo 08", "J'Adore Negombo", "Venezia Negombo", "Skye Blossom Kottawa",
  "The Reflection Thalawathugoda", "The Palace - Gampaha", "The Colombo Border - Peliyagoda", "YOLO - Kiribathgoda", "Prime Kadawatha",
  "Cest la Vie", "Viva La Vida - Kottawa", "88 Residence Kahathuduwa", "Clover Thalawathugoda", "Elemint Suites Gampaha", "Kaloora Kalutara",
  "Magna Mattegoda", "Prime Evoke Kadawatha", "Water Estate Moratuwa", "Waterfall Residencies Malabe", "Signature Villas Nugegoda",
  "Latitude Rajagiriya", "Imaarat Bambalapitiya", "Barrington Towers", "Rush Court 4 Mount Lavinia", "Vauxhall DSTRCT", "ICON V Talpe",
  "MIRA Weligama", "Bay One Residences", "Oceanista Residencies Panadura", "Ultima Kadawatha", "Platinum 10 Kesbewa", "Sky Villa Crystal Sands",
  "Araliya Breeze", "The Hive Rathmalana",
];

export const FIRST = ["Nimal", "Kasun", "Dilani", "Tharindu", "Sanduni", "Ruwan", "Ishara", "Chamara", "Priyanka", "Lakmal", "Nadeesha", "Pradeep", "Thilini", "Asanka", "Hasini", "Dinesh", "Kavindi", "Suresh", "Anjali", "Ravindra", "Mohamed", "Fathima", "Arun", "Kumar"];
export const LAST = ["Perera", "Fernando", "Silva", "Jayawardena", "Wickramasinghe", "Gunasekara", "Rajapaksa", "De Mel", "Senanayake", "Abeysekera", "Karunaratne", "Hettiarachchi", "Rathnayake", "Dissanayake", "Mendis", "Samarasinghe", "Nadarajah", "Rahman"];
export const personName = (rng: Rng) => `${pick(rng, FIRST)} ${pick(rng, LAST)}`;
export const phone = (rng: Rng) => `+94 7${pick(rng, ["0", "1", "2", "6", "7", "8"])} ${int(rng, 100, 999)} ${int(rng, 1000, 9999)}`;
export const landline = (rng: Rng) => `+94 11 ${int(rng, 200, 799)} ${int(rng, 1000, 9999)}`;
export const lkr = (rng: Rng, minMillion: number, maxMillion: number) => Math.round(((minMillion + rng() * (maxMillion - minMillion)) * 1_000_000) / 50_000) * 50_000;
export const money = (n: number) => `Rs. ${n.toLocaleString("en-LK")}`;

export const PARAGRAPHS = [
  "A boutique residence of just 44 apartments with a rooftop infinity pool, sky lounge and 24-hour security, a short walk from the city's main schools and hospitals.",
  "Thoughtfully planned apartments with generous balconies, branded fittings and a payment plan that spreads the cost over the construction period.",
  "Set in a quiet residential road yet minutes from the Southern Expressway, with a clear title, approved plans and a completion date backed by the developer.",
  "Spacious two and three bedroom homes with a double-height lobby, covered parking, backup power and a landscaped podium garden for residents.",
  "Gated community of detached villas on freehold land, with a clubhouse, children's play area, jogging track and 24-hour water supply.",
];
export const LEAD_MESSAGES = [
  "Hi, I'd like the latest price list and the payment plan for the 2 bedroom units please.",
  "Is the 3 bedroom unit on the 12th floor still available? We are buying from Australia.",
  "Can I get a site visit this Saturday morning? Two adults.",
  "What is the completion date and is the deed transferred at handover?",
  "Please send the brochure and floor plans on WhatsApp.",
  "Are there any units with a sea view? Budget around Rs. 85M.",
];
export const TRAFFIC = ["organic_search", "direct", "organic_social", "referral", "paid_social"];
export const DEVICES = ["mobile", "desktop", "tablet"];
export const REGIONS = ["Western", "Central", "Southern", "New South Wales", "Ontario", "London", "Dubai"];

// Free, rule-based "plain language" search (owner, 2026-10-01: "build a free version without an AI service that
// understands bedrooms, price, area and type and feeds the existing search"). No API, no cost, no network: it
// pulls bedrooms / price / home type / status / city / land out of a sentence like
// "3 bedroom apartment in Colombo under 50M" and hands the rest to the normal text search.
// Anything it doesn't understand stays in `text`, so a plain query like "Rajagiriya" behaves exactly as before.

export type ParsedSearch = {
  /** What's left after the understood parts are removed — matched against name/location/city/district as before. */
  text: string;
  minBeds?: number;
  maxBeds?: number;
  minPriceLkr?: number;
  maxPriceLkr?: number;
  /** Matches Project.type: Condominium | Apartments | Villas | Townhouse | Housing. */
  type?: string;
  /** Matches Project.status. */
  status?: string;
  city?: string;
  land?: boolean;
  /** Human-readable summary of what was understood, shown as chips ("3 bedrooms", "Under Rs. 50M"). */
  chips: string[];
};

const WORD_NUMBERS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
const NUM = "(\\d+(?:\\.\\d+)?|one|two|three|four|five|six)";
const AMOUNT = "(?:rs\\.?|lkr)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(billion|bn|b|million|mn|m|thousand|k|lakhs?|lks?)?";

function toNumber(raw: string): number {
  const word = WORD_NUMBERS[raw.toLowerCase()];
  return word ?? parseFloat(raw.replace(/,/g, ""));
}

function toLkr(value: string, unit?: string): number {
  const n = parseFloat(value.replace(/,/g, ""));
  const u = (unit ?? "").toLowerCase();
  if (u === "billion" || u === "bn" || u === "b") return n * 1_000_000_000;
  if (u === "million" || u === "mn" || u === "m") return n * 1_000_000;
  if (u === "thousand" || u === "k") return n * 1_000;
  if (u.startsWith("lakh") || u.startsWith("lk")) return n * 100_000;
  return n;
}

export function formatLkrShort(value: number): string {
  if (value >= 1_000_000_000) return `Rs. ${+(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `Rs. ${+(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `Rs. ${+(value / 1_000).toFixed(1)}K`;
  return `Rs. ${value}`;
}

const TYPES: { pattern: RegExp; type: string }[] = [
  { pattern: /\b(apartments?|flats?)\b/i, type: "Apartments" },
  { pattern: /\b(condominiums?|condos?)\b/i, type: "Condominium" },
  { pattern: /\bvillas?\b/i, type: "Villas" },
  { pattern: /\btown ?houses?\b/i, type: "Townhouse" },
  { pattern: /\b(houses?|housing)\b/i, type: "Housing" },
];

const STATUSES: { pattern: RegExp; status: string }[] = [
  { pattern: /\b(under construction|being built)\b/i, status: "Under Construction" },
  { pattern: /\b(coming soon|upcoming|off[- ]?plan|pre[- ]?launch)\b/i, status: "Coming Soon" },
  { pattern: /\b(nearly complete|almost (?:done|ready|complete))\b/i, status: "Nearly Complete" },
  { pattern: /\b(ready to move|move[- ]in ready|ready|completed|finished)\b/i, status: "Completed" },
  { pattern: /\bnow selling\b/i, status: "Now Selling" },
];

const FILLER = /\b(in|at|near|around|for|sale|buy|looking|find|show|me|a|an|the|with|and|of|to|new|homes?|properties|property|projects?|available|cheap|please)\b/gi;

export function parseNaturalSearch(raw: string, cityNames: string[] = []): ParsedSearch {
  let rest = ` ${raw.toLowerCase().replace(/\s+/g, " ").trim()} `;
  const out: ParsedSearch = { text: "", chips: [] };
  const take = (re: RegExp, fn: (m: RegExpMatchArray) => void) => {
    const m = rest.match(re);
    if (!m) return false;
    fn(m);
    rest = rest.replace(m[0], " ");
    return true;
  };

  // Price: "between 20 and 40 million", "under 50M", "above Rs. 30 mn", "up to 25m"
  take(new RegExp(`between\\s+${AMOUNT}\\s+(?:and|to|-)\\s+${AMOUNT}`, "i"), (m) => {
    // A unit written once ("20 and 40 million") applies to both numbers.
    const unitB = m[4] ?? m[2];
    const lo = toLkr(m[1], m[2] ?? unitB), hi = toLkr(m[3], unitB);
    out.minPriceLkr = Math.min(lo, hi);
    out.maxPriceLkr = Math.max(lo, hi);
    out.chips.push(`${formatLkrShort(out.minPriceLkr)} – ${formatLkrShort(out.maxPriceLkr)}`);
  });
  if (out.maxPriceLkr === undefined) {
    take(new RegExp(`(?:under|below|less than|up to|upto|within|max(?:imum)?|budget(?: of)?|<)\\s*${AMOUNT}`, "i"), (m) => {
      out.maxPriceLkr = toLkr(m[1], m[2]);
      out.chips.push(`Under ${formatLkrShort(out.maxPriceLkr)}`);
    });
    take(new RegExp(`(?:over|above|more than|from|min(?:imum)?|at least|starting from|>)\\s*${AMOUNT}`, "i"), (m) => {
      out.minPriceLkr = toLkr(m[1], m[2]);
      out.chips.push(`From ${formatLkrShort(out.minPriceLkr)}`);
    });
  }

  // Bedrooms: "3 bedroom", "3br", "3+ beds", "two bed", "2 to 3 bedroom"
  take(new RegExp(`${NUM}\\s*(?:-|to)\\s*${NUM}\\s*(?:bed(?:room)?s?|br|bhk|bd)\\b`, "i"), (m) => {
    out.minBeds = toNumber(m[1]);
    out.maxBeds = toNumber(m[2]);
    out.chips.push(`${out.minBeds}–${out.maxBeds} bedrooms`);
  }) ||
    take(new RegExp(`${NUM}\\s*(\\+)?\\s*[- ]?(?:bed(?:room)?s?|br|bhk|bd)\\b`, "i"), (m) => {
      const n = toNumber(m[1]);
      out.minBeds = n;
      if (!m[2]) out.maxBeds = n;
      out.chips.push(m[2] ? `${n}+ bedrooms` : `${n} bedroom${n === 1 ? "" : "s"}`);
    });

  // Land / plots
  if (take(/\b(land|lands|plots?|perch(?:es)?|acres?|block)\b/i, () => { out.land = true; })) out.chips.push("Land");

  for (const { pattern, type } of TYPES) {
    if (take(pattern, () => { out.type = type; })) { out.chips.push(type); break; }
  }
  for (const { pattern, status } of STATUSES) {
    if (take(pattern, () => { out.status = status; })) { out.chips.push(status); break; }
  }

  // City: longest name first so "Mount Lavinia" wins over "Colombo"-style prefixes.
  // "Colombo 02" / "Colombo 05" listings also answer to a bare "Colombo" (strip the district number to get the base name).
  const bases = cityNames.map((c) => c.replace(/\s+\d+$/, ""));
  for (const city of Array.from(new Set([...cityNames, ...bases])).filter((c) => c && c !== "All of Sri Lanka").sort((a, b) => b.length - a.length)) {
    const re = new RegExp(`\\b${city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (take(re, () => { out.city = city; })) { out.chips.push(city); break; }
  }

  // Only treat the rest as free text when something structured was understood — otherwise keep the query verbatim.
  out.text = out.chips.length > 0 ? rest.replace(FILLER, " ").replace(/[,.;:+\-–]+/g, " ").replace(/\s+/g, " ").trim() : raw.trim();
  return out;
}

/**
 * Does a project offer the requested bedroom count? Reads its bedrooms text ("2", "1–3", "2, 3 & 4") and, as a
 * fallback, its floor plans' own bedroom counts. A project with no bedroom data at all never matches a bedroom
 * search (nothing is assumed).
 */
export function bedroomsMatch(project: { bedrooms?: string; floorPlans?: { bedrooms?: number }[] }, min?: number, max?: number): boolean {
  if (min === undefined) return true;
  const nums = [
    ...((project.bedrooms ?? "").match(/\d+/g)?.map(Number) ?? []),
    ...(project.floorPlans ?? []).map((plan) => plan.bedrooms).filter((n): n is number => typeof n === "number" && n > 0),
  ];
  if (nums.length === 0) return false;
  const lo = Math.min(...nums), hi = Math.max(...nums);
  // "3 bedroom": the project offers 3 (within its range). "3+": it offers 3 or more.
  return max === undefined ? hi >= min : lo <= max && hi >= min;
}

/** Home type words map loosely onto the stored Project.type values ("House", "Luxury Villas", "Condominium"...). */
export function typeMatches(projectType: string | undefined, wanted: string): boolean {
  const t = (projectType ?? "").toLowerCase();
  if (wanted === "Apartments" || wanted === "Condominium") return /apartment|condo|residence|suite/.test(t);
  if (wanted === "Villas") return /villa/.test(t);
  if (wanted === "Townhouse") return /town/.test(t);
  if (wanted === "Housing") return /house|housing|home/.test(t);
  return t === wanted.toLowerCase();
}

/** "Colombo" matches the Colombo 02 / Colombo 05 listings too — by city, location or district. */
export function cityMatches(project: { city?: string; location?: string; district?: string }, wanted: string): boolean {
  const w = wanted.toLowerCase();
  return [project.city, project.location, project.district].some((v) => {
    const x = (v ?? "").toLowerCase();
    return x === w || x.startsWith(`${w} `) || x.includes(`${w},`) || x.includes(` ${w}`);
  });
}

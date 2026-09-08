import { parse } from "node-html-parser";
import { AMENITY_NAME_OPTIONS, CITY_OPTIONS, DISTRICT_OPTIONS, PROJECT_TYPE_OPTIONS } from "@/collections/shared-fields";

// "Import from your website": turns a developer's project web page (or the
// text of a brochure PDF) into a *draft* listing for a human to review.
//
// This is deliberately heuristic and conservative. It only lifts things that
// are literally on the page — title, description paragraphs, images, a
// brochure link, contact details, an address, amenity words, distances
// ("1 km to Majestic City") — and it never fabricates a number: sizes,
// prices and bedroom counts it finds in the text are returned as `signals`
// for the developer to confirm, not written into floor plans. See
// docs/supabase-workflow.md Standing Rule 4.

export type ImportSignals = {
  sizesSqFt: number[];
  pricesLkr: number[];
  bedrooms: number[];
  /** Phrases like "3 Bedroom – 1,300 sq ft" found in the text, verbatim. */
  floorPlanHints: string[];
  paymentPlanLines: string[];
};

export type ImportDraft = {
  sourceUrl?: string;
  name?: string;
  summary?: string;
  description?: string;
  highlights: string[];
  images: string[];
  floorPlanImages: string[];
  brochureUrl?: string;
  phones: string[];
  emails: string[];
  address?: string;
  city?: string;
  district?: string;
  type?: string;
  amenities: string[];
  nearby: { name: string; distanceKm?: number }[];
  socialLinks: Record<string, string>;
  units?: number;
  floors?: number;
  completionYear?: number;
  /** Only set when the page says "from Rs. X" / "starting at LKR X". */
  startingPriceLkr?: number;
  signals: ImportSignals;
  warnings: string[];
};

const emptyDraft = (): ImportDraft => ({
  highlights: [], images: [], floorPlanImages: [], phones: [], emails: [], amenities: [], nearby: [], socialLinks: {},
  signals: { sizesSqFt: [], pricesLkr: [], bedrooms: [], floorPlanHints: [], paymentPlanLines: [] }, warnings: [],
});

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const uniq = <T,>(list: T[]) => Array.from(new Set(list));

// Amenity vocabulary → the words developers actually use for it.
const AMENITY_SYNONYMS: Record<string, RegExp> = {
  "Infinity Pool": /infinity pool/i,
  Pool: /\b(swimming )?pool\b/i,
  Gym: /\b(gym|gymnasium|fitness (centre|center|room))\b/i,
  Rooftop: /\brooftop\b/i,
  Parking: /\b(car ?park(ing)?|parking (bay|space|slot)s?)\b/i,
  Security: /\b24[\s/-]*(7|hour|hr)?\s*security\b|\bsecurity (guard|service)/i,
  CCTV: /\bcctv\b/i,
  Garden: /\b(landscaped )?(garden|green space)s?\b/i,
  "Children's Area": /\b(children'?s?|kids'?) (play ?area|play ?ground|pool|zone)\b/i,
  Clubhouse: /\bclub ?house\b/i,
  "EV Charging": /\bev[\s-]*charg/i,
  Concierge: /\bconcierge\b/i,
  "Padel Court": /\bpadel\b/i,
  "Resident Lounge": /\b(residents?'? )?lounge\b/i,
  "Private Elevator": /\bprivate (lift|elevator)s?\b/i,
  "Games Room": /\bgames? room\b/i,
  "Sky Lounge": /\bsky (lounge|bar)\b/i,
  "Retail Mall": /\b(retail|shopping) (mall|arcade|space)\b/i,
  "Gated Community": /\bgated\b/i,
  Beachfront: /\bbeach ?front\b/i,
  "Sea View": /\b(sea|ocean) ?view/i,
};

const TYPE_KEYWORDS: [RegExp, string][] = [
  [/\bserviced apartment/i, "Serviced Apartment"],
  [/\bcondominium/i, "Condominium"],
  [/\bluxury villa/i, "Luxury Villas"],
  [/\bvilla/i, "Villas"],
  [/\btown ?house/i, "Townhouse"],
  [/\bapartment|\bresidences\b|\btower\b/i, "Apartments"],
  [/\bhouse\b|\bhousing\b/i, "House"],
];

function absoluteUrl(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined;
  const s = src.trim();
  if (!s || s.startsWith("data:") || s.startsWith("javascript:")) return undefined;
  try { return new URL(s, base).toString(); } catch { return undefined; }
}

const IMAGE_EXT = /\.(jpe?g|png|webp)(\?|$)/i;
const IMAGE_SKIP = /logo|icon|sprite|avatar|favicon|badge|flag|placeholder|pixel|tracking|1x1|blank|spacer|arrow|bullet|whatsapp|facebook|instagram/i;
const FLOOR_PLAN_HINT = /floor[\s-]*plan|\bplan\b|layout|\btype[-_ ]?[a-z0-9]\b|\bunit[-_ ]?[a-z0-9]\b|artboard/i;

function largestFromSrcset(srcset: string | undefined): string | undefined {
  if (!srcset) return undefined;
  const candidates = srcset.split(",").map((c) => c.trim().split(/\s+/)).filter((c) => c[0]);
  if (!candidates.length) return undefined;
  candidates.sort((a, b) => (parseFloat(b[1] ?? "0") || 0) - (parseFloat(a[1] ?? "0") || 0));
  return candidates[0][0];
}

function parseJsonLd(root: ReturnType<typeof parse>): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  for (const el of root.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const data = JSON.parse(el.text);
      const list = Array.isArray(data) ? data : data?.["@graph"] ? data["@graph"] : [data];
      for (const item of list) if (item && typeof item === "object") out.push(item);
    } catch { /* ignore malformed JSON-LD */ }
  }
  return out;
}

// Organisation/website schema carries the company's office address, not
// the project's — only trust addresses on place/listing-like nodes.
const ADDRESS_TYPE_SKIP = /organization|corporation|localbusiness|website|webpage|person|breadcrumb/i;

function findAddressInJsonLd(items: Record<string, unknown>[]): string | undefined {
  const walk = (v: unknown, depth = 0): string | undefined => {
    if (!v || typeof v !== "object" || depth > 4) return undefined;
    const o = v as Record<string, unknown>;
    const type = String(o["@type"] ?? "");
    if (ADDRESS_TYPE_SKIP.test(type)) return undefined;
    const addr = o.address;
    if (addr && typeof addr === "object") {
      const a = addr as Record<string, string>;
      const parts = [a.streetAddress, a.addressLocality, a.addressRegion].filter(Boolean);
      if (parts.length) return clean(parts.join(", "));
    }
    if (typeof addr === "string" && addr.length > 8) return clean(addr);
    for (const val of Object.values(o)) { const found = walk(val, depth + 1); if (found) return found; }
    return undefined;
  };
  for (const item of items) { const found = walk(item); if (found) return found; }
  return undefined;
}

const toNumber = (s: string) => Number(s.replace(/[,\s]/g, ""));

// Sri Lankan numbers only: 10 digits starting with 0, or +94 + 9 digits.
// Returns them in the site's display form (+94 77 770 7874); anything else
// (a "0024002500" hotline artefact, a tracking id) is dropped.
function normalizePhone(raw: string): string | undefined {
  const digits = raw.replace(/\D/g, "");
  const national = digits.startsWith("94") && digits.length === 11 ? digits.slice(2) : digits.startsWith("0") && digits.length === 10 ? digits.slice(1) : undefined;
  if (!national || !/^[1-9]\d{8}$/.test(national)) return undefined;
  return `+94 ${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

// "TYPE A GROUND FLOOR PLANFIRST FLOOR PLAN 4 Bedrooms House 2030 SQFT" →
// "TYPE A 4 Bedrooms House 2030 SQFT".
const tidyHint = (s: string) => clean(s.replace(/\b(?:ground|first|second|third|upper|lower|typical)\s*floor\s*plans?\b/gi, " ").replace(/\bfloor\s*plans?\b/gi, " ").replace(/\b\d{1,2}\s+(?=\d\s*bed)/gi, ""));

// Text-only signals — shared by the HTML path and the PDF path.
export function extractFromText(text: string, draft: ImportDraft = emptyDraft()): ImportDraft {
  const t = clean(text);

  draft.phones = uniq([...draft.phones, ...(t.match(/(?<![\d+])(?:\+94|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g) ?? []).map(normalizePhone).filter((p): p is string => Boolean(p))]).slice(0, 4);
  draft.emails = uniq([...draft.emails, ...(t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).filter((e) => !/\.(png|jpe?g|gif|webp)$/i.test(e) && !/example\./i.test(e))]).slice(0, 3);

  for (const [name, re] of Object.entries(AMENITY_SYNONYMS)) if (re.test(t) && (AMENITY_NAME_OPTIONS as string[]).includes(name)) draft.amenities.push(name);
  draft.amenities = uniq(draft.amenities);

  if (!draft.type) { for (const [re, type] of TYPE_KEYWORDS) if (re.test(t) && (PROJECT_TYPE_OPTIONS as string[]).includes(type)) { draft.type = type; break; } }

  const units = t.match(/\b(\d{2,4})\s+(?:luxury |residential |exclusive |premium |modern |spacious |brand[- ]new )?(?:apartments?|units?|residences|villas?|homes?|houses)\b/i);
  if (units && !draft.units && Number(units[1]) >= 2) draft.units = Number(units[1]);
  const floors = t.match(/\b([1-9]\d?)[\s-]*(?:storey|story|stories|storeyed|floors?|levels?)\b/i);
  if (floors && !draft.floors) draft.floors = Number(floors[1]);
  const year = t.match(/\b(?:hand[\s-]?over|completion|complete[ds]?|move[\s-]?in|ready|deliver\w*)\b[^.]{0,40}?\b(20[2-4]\d)\b/i) ?? t.match(/\bQ[1-4]\s*(20[2-4]\d)\b/i);
  if (year && !draft.completionYear) draft.completionYear = Number(year[1]);

  draft.signals.sizesSqFt = uniq([...draft.signals.sizesSqFt, ...[...t.matchAll(/(?<![\d,])(\d{1,2},?\d{3}|\d{3})\s*(?:sq\.?\s*ft|sqft|square feet|sq\.?\s*feet)\b/gi)].map((m) => toNumber(m[1])).filter((n) => n >= 250 && n <= 20000)]);
  draft.signals.bedrooms = uniq([...draft.signals.bedrooms, ...[...t.matchAll(/\b([1-6])\s*(?:-\s*)?(?:bed(?:room)?s?|br)\b/gi)].map((m) => Number(m[1]))]).sort();
  const prices = [...t.matchAll(/\b(?:Rs\.?|LKR)\s*([\d,]+(?:\.\d+)?)\s*(million|mn|m)?\b/gi)].map((m) => { const n = toNumber(m[1]); return m[2] ? Math.round(n * 1_000_000) : n; }).filter((n) => n >= 1_000_000 && n < 5_000_000_000);
  draft.signals.pricesLkr = uniq([...draft.signals.pricesLkr, ...prices]).sort((a, b) => a - b);
  const from = t.match(/\b(?:from|starting (?:at|from)|starts (?:at|from)|priced from)\s*(?:Rs\.?|LKR)\s*([\d,]+(?:\.\d+)?)\s*(million|mn|m)?\b/i);
  if (from && !draft.startingPriceLkr) { const n = toNumber(from[1]); draft.startingPriceLkr = from[2] ? Math.round(n * 1_000_000) : n; }

  draft.signals.floorPlanHints = uniq([...draft.signals.floorPlanHints, ...[...t.matchAll(/\b((?:[1-6]\s*(?:-\s*)?bed(?:room)?s?|studio|penthouse|duplex|(?:unit|type)\s*[A-Z0-9]{1,3})\b[^.]{0,60}?\b\d{1,2},?\d{3}\s*(?:sq\.?\s*ft|sqft))/gi)].map((m) => tidyHint(m[1])).slice(0, 12)]);
  draft.signals.paymentPlanLines = uniq([...draft.signals.paymentPlanLines, ...[...t.matchAll(/\b(\d{1,2}(?:\.\d)?%\s*[^.;]{5,90}?(?:reservation|booking|down ?payment|instal?lments?|handover|completion|month(?:ly|s)?))/gi)].map((m) => clean(m[1])).slice(0, 8)]);

  // "1 km to Majestic City", "5 minutes to Dharmapala College" — the place
  // is a run of capitalised words (with of/the/de/& allowed inside), which
  // is what stops it in flowing text where no punctuation follows.
  const nearbyRe = /\b(\d+(?:\.\d+)?)\s*([Kk][Mm]|[Kk]ilomet\w*|m|[Mm]eters?|[Mm]etres?|[Mm]in(?:ute)?s?)\b\s*(?:[Dd]rive\s*)?(?:[Tt]o|[Ff]rom|away from)\s+(?:the\s+)?((?:[A-Z][\w'&.-]*)(?:\s+(?:of|the|de|&|[A-Z][\w'&.-]*)){0,4})/g;
  for (const m of t.matchAll(nearbyRe)) {
    const n = Number(m[1]); const unit = m[2].toLowerCase(); const name = clean(m[3]);
    if (draft.nearby.some((p) => p.name.toLowerCase() === name.toLowerCase())) continue;
    const distanceKm = unit.startsWith("k") ? n : unit.startsWith("m") && !unit.startsWith("min") ? Math.round(n) / 1000 : undefined;
    draft.nearby.push({ name, ...(distanceKm !== undefined ? { distanceKm } : {}) });
    if (draft.nearby.length >= 12) break;
  }

  // The town at the end of the street address wins outright ("Wanaguru
  // Mawatha, Thalawathugoda" → Thalawathugoda), even when it isn't in the
  // city vocabulary — the endpoint stores unknown names as city_other.
  if (!draft.city && draft.address) {
    const tail = draft.address.split(",").map((s) => s.trim()).filter(Boolean).slice(1).reverse().find((s) => /^[A-Z][A-Za-z']+(?:\s[A-Z][A-Za-z']+)?$/.test(s) && !/^Sri Lanka$/i.test(s) && !/^Colombo\s*\d/.test(s));
    if (tail) draft.city = CITY_OPTIONS.find((c) => c.toLowerCase() === tail.toLowerCase()) ?? tail;
  }
  if (!draft.city) {
    // Score every known city mentioned: the title and address count far
    // more than a passing mention in the body (a "10 minutes to X" line
    // shouldn't win over the project's own town).
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const title = ` ${draft.name ?? ""} ${draft.summary ?? ""} `;
    const address = ` ${draft.address ?? ""} `;
    const body = ` ${t.slice(0, 6000)} `;
    let best: { city: string; score: number } | undefined;
    for (const city of CITY_OPTIONS) {
      if (city.length <= 3) continue;
      const re = new RegExp(`\\b${escape(city)}\\b`, "gi");
      const inTitle = re.test(title); re.lastIndex = 0;
      const inAddress = re.test(address); re.lastIndex = 0;
      const mentions = (body.match(re) ?? []).length;
      if (!inTitle && !inAddress && !mentions) continue;
      // The address is the strongest signal — a neighbouring town can be
      // mentioned many times in "minutes to…" copy without being the site.
      const score = (inTitle ? 6 : 0) + (inAddress ? 12 : 0) + mentions;
      if (!best || score > best.score) best = { city, score };
    }
    draft.city = best?.city;
  }
  if (!draft.district) draft.district = DISTRICT_OPTIONS.find((d) => new RegExp(`\\b${d}\\b`, "i").test(`${draft.address ?? ""} ${t.slice(0, 4000)}`));

  if (!draft.description && t.length > 200) {
    draft.description = t.slice(0, 1500).replace(/\s+\S*$/, "") + "…";
    draft.warnings.push("Description was taken from the raw page/brochure text — rewrite it before publishing.");
  }
  return draft;
}

export function extractFromHtml(html: string, sourceUrl: string): ImportDraft {
  const draft = emptyDraft();
  draft.sourceUrl = sourceUrl;
  const root = parse(html, { blockTextElements: { script: true, style: true, noscript: true } });
  const meta = (name: string) => root.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute("content")?.trim();

  // Brochure + social + image candidates come from the full DOM, before we strip chrome.
  for (const a of root.querySelectorAll("a[href]")) {
    const href = absoluteUrl(a.getAttribute("href"), sourceUrl);
    if (!href) continue;
    if (/\.pdf(\?|$)/i.test(href) && !draft.brochureUrl) draft.brochureUrl = href;
    const host = (() => { try { return new URL(href).hostname; } catch { return ""; } })();
    for (const [key, re] of Object.entries({ facebook: /facebook\.com/, instagram: /instagram\.com/, youtube: /youtube\.com|youtu\.be/, linkedin: /linkedin\.com/, tiktok: /tiktok\.com/, whatsapp: /wa\.me|whatsapp\.com/ })) {
      if (re.test(host) && !draft.socialLinks[key]) draft.socialLinks[key] = href;
    }
    if (/^mailto:/i.test(a.getAttribute("href") ?? "")) draft.emails.push((a.getAttribute("href") ?? "").replace(/^mailto:/i, "").split("?")[0]);
  }

  const seen = new Set<string>();
  const og = absoluteUrl(meta("og:image"), sourceUrl);
  const pushImage = (url: string | undefined, hint: string) => {
    if (!url || seen.has(url) || !IMAGE_EXT.test(url) || IMAGE_SKIP.test(url)) return;
    seen.add(url);
    if (FLOOR_PLAN_HINT.test(hint) || FLOOR_PLAN_HINT.test(url.split("/").pop() ?? "")) draft.floorPlanImages.push(url); else draft.images.push(url);
  };
  pushImage(og, "");
  for (const img of root.querySelectorAll("img")) {
    const w = Number(img.getAttribute("width") ?? 0), h = Number(img.getAttribute("height") ?? 0);
    if ((w && w < 200) || (h && h < 150)) continue;
    const hint = `${img.getAttribute("alt") ?? ""} ${img.getAttribute("class") ?? ""} ${img.getAttribute("title") ?? ""}`;
    pushImage(absoluteUrl(largestFromSrcset(img.getAttribute("srcset") ?? img.getAttribute("data-srcset")) ?? img.getAttribute("src") ?? img.getAttribute("data-src") ?? img.getAttribute("data-lazy-src"), sourceUrl), hint);
  }
  draft.images = draft.images.slice(0, 30);
  draft.floorPlanImages = draft.floorPlanImages.slice(0, 12);

  // Brochures are often wired up by script (download buttons, data-* attrs)
  // rather than a plain <a href>, so also scan the raw markup for any PDF URL.
  if (!draft.brochureUrl) {
    const m = html.match(/https?:\/\/[^\s"'<>()]+\.pdf(?:\?[^\s"'<>()]*)?/i) ?? html.match(/["'(]([^"'()\s]+\.pdf(?:\?[^"'()\s]*)?)["')]/i);
    const found = absoluteUrl(m?.[1] ?? m?.[0], sourceUrl);
    if (found) draft.brochureUrl = found;
  }

  const jsonLd = parseJsonLd(root);
  draft.address = findAddressInJsonLd(jsonLd);

  // Title: og:title → <title> → h1, minus the site-name suffix. All-caps
  // marketing titles ("VIVA LA VIDA") become Title Case.
  const rawTitle = meta("og:title") || root.querySelector("title")?.text || root.querySelector("h1")?.text || "";
  const title = clean(rawTitle).split(/\s+[|–—-]\s+/)[0].slice(0, 120);
  draft.name = (title && title === title.toUpperCase() ? title.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : title) || undefined;
  draft.summary = clean(meta("description") || meta("og:description") || "").slice(0, 400) || undefined;

  // Contact details usually live in the header/footer — read them from the
  // whole page before that chrome is stripped for the body copy.
  // structuredText keeps a line break between blocks; plain .text glues
  // "Highlights5 minutes to Dharmapala College5 minutes…" together.
  const fullText = clean(root.structuredText);
  draft.phones = uniq((fullText.match(/(?<![\d+])(?:\+94|0)[\s-]?\d{2}[\s-]?\d{3}[\s-]?\d{4}\b/g) ?? []).map(normalizePhone).filter((p): p is string => Boolean(p))).slice(0, 4);
  draft.emails = uniq([...draft.emails, ...(fullText.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).filter((e) => !/\.(png|jpe?g|gif|webp|svg|css|js)$/i.test(e) && !/example\.|sentry|wixpress|schema\.org/i.test(e))]).slice(0, 3);

  // Strip chrome, then read body copy.
  root.querySelectorAll("script, style, noscript, nav, footer, header, form, iframe, svg").forEach((el) => el.remove());
  const paragraphs = uniq(root.querySelectorAll("p").map((p) => clean(p.text)).filter((s) => s.length >= 80 && !/cookie|privacy policy|all rights reserved|©/i.test(s)));
  if (paragraphs.length) draft.description = paragraphs.join("\n\n").slice(0, 2500);
  const bullets = uniq(root.querySelectorAll("li").map((li) => clean(li.text)).filter((s) => s.length >= 15 && s.length <= 120 && !/menu|login|sign|cookie|©/i.test(s)));
  draft.highlights = bullets.filter((s) => /\d/.test(s) || Object.values(AMENITY_SYNONYMS).some((re) => re.test(s))).slice(0, 6);

  const bodyText = clean(root.structuredText);
  if (!draft.address) {
    // A street line: optional "No. 12," + 1–4 capitalised words + a road
    // word, then at most two ", Place" fragments. Stops before prose, and
    // "Road Map" / "Floor Plan" menu items are explicitly rejected.
    const streetRe = /\b(?:No\.?\s*\d+[A-Za-z/-]*,?\s*)?(?:[A-Z][A-Za-z'.]+\s){1,4}(?:Road|Rd|Mawatha|Lane|Avenue|Ave|Street|St|Place|Drive|Terrace|Gardens)\b(?!\s*(?:Map|Plan|Access|Frontage|Width))(?:,\s*(?:Colombo\s*\d{1,2}|[A-Z][A-Za-z']+(?:\s[A-Z][A-Za-z']+)?)){0,2}/g;
    for (const m of bodyText.matchAll(streetRe)) {
      const candidate = clean(m[0]);
      if (/\b(Brochure|Plan|Videos?|Gallery|Menu|Login|Type [A-Z])\b/.test(candidate)) continue;
      draft.address = candidate.slice(0, 120);
      break;
    }
  }
  if (!draft.name) draft.warnings.push("No page title found — name the project before publishing.");
  if (!draft.images.length) draft.warnings.push("No usable photos found on the page.");
  return extractFromText(bodyText, draft);
}

export function toSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

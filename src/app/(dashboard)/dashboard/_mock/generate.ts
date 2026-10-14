import type { CollectionSchema, Row, SchemaField } from "./types";
import { CITIES, COUNTS, DEVELOPERS, LEAD_MESSAGES, PARAGRAPHS, PROJECTS, REGIONS, DEVICES, TRAFFIC, chance, daysAgo, daysAhead, hash, int, lkr, makeRng, personName, phone, pick, slugify, type Rng } from "./seeds";

// Builds mock records from the exported Payload schema, so every collection has realistic-looking data without being
// hand-written. Relationship values are plain ids in 1..COUNTS[target]: no collection needs another one to exist first.

type Ctx = { slug: string; i: number; rng: Rng };

const TEXT_BY_NAME: [RegExp, (c: Ctx, f: SchemaField) => string][] = [
  [/email/i, (c) => `${slugify(personName(c.rng)).replace(/-/g, ".")}@${pick(c.rng, DEVELOPERS).domain}`],
  [/whatsapp|phone|mobile|hotline|tel/i, (c) => phone(c.rng)],
  [/website|url|link|href/i, (c) => `https://www.${pick(c.rng, DEVELOPERS).domain}/`],
  [/^slug$|slug$/i, (c) => slugify(`${pick(c.rng, PROJECTS)}-${c.i}`)],
  [/image|logo|photo|picture|banner|cover|thumbnail|poster/i, (c, f) => `https://media.lankanewhomes.com/${c.slug}/${slugify(f.name ?? "image")}-${c.i + 1}.jpg`],
  [/address|location|road|area$/i, (c) => `${int(c.rng, 3, 180)}, ${pick(c.rng, ["Galle Road", "Baseline Road", "Sri Jayawardenepura Mawatha", "Kandy Road", "Park Street", "Marine Drive"])}, ${pick(c.rng, CITIES)}`],
  [/city|district|town/i, (c) => pick(c.rng, CITIES)],
  [/province/i, () => "Western"],
  [/country/i, () => "Sri Lanka"],
  [/title|headline|subject/i, (c) => `${pick(c.rng, PROJECTS)}`],
  [/name/i, (c, f) => (/company|builder|developer|seller|firm/i.test(f.name ?? "") ? pick(c.rng, DEVELOPERS).name : personName(c.rng))],
  [/description|summary|about|note|message|comment|body|excerpt|bio|overview/i, (c) => pick(c.rng, PARAGRAPHS)],
  [/year/i, (c) => String(int(c.rng, 2005, 2027))],
  [/code|token|reference|id$/i, (c) => `LNH-${int(c.rng, 10000, 99999)}`],
  [/source|referrer/i, (c) => pick(c.rng, ["google", "facebook", "instagram", "direct"])],
];

function textValue(f: SchemaField, c: Ctx): string {
  const name = f.name ?? "";
  for (const [re, fn] of TEXT_BY_NAME) if (re.test(name)) return fn(c, f);
  return `${f.label ?? name} ${c.i + 1}`;
}

function numberValue(f: SchemaField, c: Ctx): number {
  const n = (f.name ?? "").toLowerCase();
  let v: number;
  if (/lat/.test(n) && !/plat|flat|related/.test(n)) v = 6 + c.rng() * 1.2;
  else if (/lng|lon/.test(n)) v = 79.8 + c.rng() * 1.1;
  else if (/perch.*max|max.*perch/.test(n)) v = int(c.rng, 20, 60);
  else if (/perch/.test(n)) v = int(c.rng, 8, 35);
  else if (/acre/.test(n)) v = Math.round(c.rng() * 40) / 10;
  else if (/perpersq|persqft|psf/.test(n)) v = int(c.rng, 45, 120) * 1000;
  else if (/price|lkr|amount|cost/.test(n)) v = lkr(c.rng, 1.5, 180);
  else if (/year/.test(n)) v = int(c.rng, 2005, 2028);
  else if (/bed/.test(n)) v = int(c.rng, 1, 4);
  else if (/bath/.test(n)) v = int(c.rng, 1, 4);
  else if (/floor|storey|level/.test(n)) v = int(c.rng, 3, 38);
  else if (/units/.test(n)) v = int(c.rng, 12, 320);
  else if (/count|score|rate|percent|rating/.test(n)) v = int(c.rng, 1, 100);
  else if (/minute/.test(n)) v = int(c.rng, 3, 600);
  else if (/order/.test(n)) v = c.i + 1;
  else if (/size|area|sqft|sqm/.test(n)) v = int(c.rng, 450, 3200);
  else if (/day|duration/.test(n)) v = pick(c.rng, [7, 14, 30, 60, 90]);
  else v = int(c.rng, 1, 100);
  if (f.min !== undefined) v = Math.max(v, f.min);
  if (f.max !== undefined) v = Math.min(v, f.max);
  return /lat|lng|lon/.test(n) ? Math.round(v * 1e6) / 1e6 : Math.round(v);
}

function relId(rel: string, rng: Rng): number {
  return int(rng, 1, COUNTS[rel] ?? 10);
}

function valueFor(f: SchemaField, c: Ctx): unknown {
  switch (f.type) {
    case "text":
    case "textarea":
    case "email":
      if (f.defaultValue !== undefined && !f.required) return f.defaultValue;
      return f.required || chance(c.rng, 0.45) ? textValue(f, c) : "";
    case "number":
      if (f.defaultValue !== undefined && typeof f.defaultValue === "number" && !f.required) return f.defaultValue;
      return f.required || chance(c.rng, 0.55) ? numberValue(f, c) : null;
    case "checkbox":
      if (f.name === "isPublished") return chance(c.rng, 0.85);
      if (typeof f.defaultValue === "boolean" && c.rng() < 0.6) return f.defaultValue;
      return chance(c.rng, 0.25);
    case "select":
    case "radio": {
      const opts = f.options ?? [];
      if (opts.length === 0) return f.hasMany ? [] : null;
      if (f.hasMany) return opts.filter(() => chance(c.rng, 0.12)).slice(0, 3).map((o) => o.value);
      if (f.defaultValue !== undefined && c.rng() < 0.5) return f.defaultValue;
      // Statuses look better when the first few options dominate.
      return (opts.length > 8 ? pick(c.rng, opts) : opts[Math.min(opts.length - 1, Math.floor(c.rng() ** 1.6 * opts.length))]).value;
    }
    case "date":
      return f.name === "createdAt" || f.name === "updatedAt" ? daysAgo(int(c.rng, 1, 90), c.rng) : /end|expir|until|next|period_end/.test(f.name ?? "") ? daysAhead(int(c.rng, 5, 300)) : daysAgo(int(c.rng, 0, 120), c.rng);
    case "relationship":
    case "upload": {
      const targets = f.relationTo ?? [];
      const make = (t: string) => (targets.length > 1 ? { relationTo: t, value: relId(t, c.rng) } : relId(t, c.rng));
      if (f.hasMany) return Array.from({ length: int(c.rng, 0, 3) }, () => make(pick(c.rng, targets)));
      return f.required || chance(c.rng, 0.7) ? make(pick(c.rng, targets)) : null;
    }
    case "array": {
      const n = f.required ? int(c.rng, 1, 2) : int(c.rng, 0, 2);
      return Array.from({ length: n }, (_, k) => {
        const row: Row = { id: `${c.slug}-${c.i}-${f.name}-${k}` };
        fill(f.fields ?? [], row, { ...c, i: c.i * 10 + k });
        return row;
      });
    }
    case "group": {
      const g: Record<string, unknown> = {};
      fill(f.fields ?? [], g, c);
      return g;
    }
    case "richText":
      return `<p>${pick(c.rng, PARAGRAPHS)}</p><p>${pick(c.rng, PARAGRAPHS)}</p>`;
    case "point":
      return [79.8 + c.rng() * 1.1, 6 + c.rng() * 1.2];
    case "json":
    case "code":
      return {};
    default:
      return null;
  }
}

function fill(fields: SchemaField[], target: Record<string, unknown>, c: Ctx) {
  for (const f of fields) {
    if (f.type === "tabs") {
      for (const tab of f.tabs ?? []) {
        if (tab.name) {
          const sub: Record<string, unknown> = {};
          fill(tab.fields, sub, c);
          target[tab.name] = sub;
        } else fill(tab.fields, target, c);
      }
    } else if (f.type === "row" || f.type === "collapsible") fill(f.fields ?? [], target, c);
    else if (f.name && f.type !== "ui" && f.type !== "join") target[f.name] = valueFor(f, c);
  }
}

// ---- per-collection touches so the headline fields read like real data ----
const developerFor = (i: number, rng: Rng) => (i % 3 === 0 ? 1 : int(rng, 2, COUNTS.developers));

const OVERRIDES: Record<string, (r: Row, c: Ctx) => void> = {
  users: (r, c) => {
    const name = c.i === 0 ? "Rupan Sinnarajah" : personName(c.rng);
    r.full_name = name;
    r.email = c.i === 0 ? "rupan@lankanewhomes.com" : `${slugify(name).replace(/-/g, ".")}@${pick(c.rng, DEVELOPERS).domain}`;
    r.role = c.i === 0 ? "admin" : c.i < 4 ? "developer" : pick(c.rng, ["buyer", "buyer", "developer"]);
  },
  developers: (r, c) => {
    const d = DEVELOPERS[c.i % DEVELOPERS.length];
    r.name = d.name;
    r.slug = slugify(d.name);
    r.contact_email = `info@${d.domain}`;
    r.contact_phone = d.phone;
    r.website = `https://www.${d.domain}/`;
    r.location = "Colombo 03";
    r.establishedYear = d.year;
    r.yearsInBusiness = 2026 - d.year;
    r.activeProjects = int(c.rng, 2, 14);
    r.completedProjects = int(c.rng, 3, 60);
    r.verification_status = c.i < 6 ? "verified" : pick(c.rng, ["pending", "verified"]);
    r.domain_verified = c.i < 6;
    r.plan = c.i === 0 ? "developer-pro" : pick(c.rng, ["free", "featured", "featured-plus", "free"]);
  },
  projects: (r, c) => {
    const name = PROJECTS[c.i % PROJECTS.length];
    r.name = name;
    r.slug = slugify(name);
    r.developer = developerFor(c.i, c.rng);
    r.startingPriceLkr = lkr(c.rng, 18, 220);
    r.completionYear = int(c.rng, 2026, 2029);
    r.isPublished = c.i % 7 !== 3;
    r.featured = c.i % 5 === 0;
    r.location = `${pick(c.rng, CITIES)}, Sri Lanka`;
    r.district = "Colombo";
    r.province = "Western";
    r.coordinates = { lat: Math.round((6.85 + c.rng() * 0.35) * 1e5) / 1e5, lng: Math.round((79.84 + c.rng() * 0.15) * 1e5) / 1e5, streetViewAvailable: true };
    r.completeness_score = int(c.rng, 48, 100);
  },
  lands: (r, c) => {
    const perches = int(c.rng, 8, 40);
    const place = pick(c.rng, CITIES);
    r.title = `${perches} perch residential plot - ${place}`;
    r.slug = slugify(`${r.title}-${c.i}`);
    r.sellerType = "developer";
    const dev = developerFor(c.i, c.rng);
    r.seller = { relationTo: "developers", value: dev };
    r.sellerName = DEVELOPERS[(dev - 1) % DEVELOPERS.length].name;
    r.landSizePerches = perches;
    r.priceLkr = perches * int(c.rng, 4, 28) * 100_000;
    r.status = pick(c.rng, ["Available", "Available", "Available", "Reserved", "Sold"]);
  },
  leads: (r, c) => {
    r.name = personName(c.rng);
    r.email = `${slugify(String(r.name)).replace(/-/g, ".")}@gmail.com`;
    r.phone = phone(c.rng);
    r.message = pick(c.rng, LEAD_MESSAGES);
    r.project = int(c.rng, 1, COUNTS.projects);
    r.status = pick(c.rng, ["new", "new", "contacted", "site_visit", "closed"]);
    r.createdAt = daysAgo(c.i * 0.4, c.rng);
    r.origin = { country: pick(c.rng, ["Sri Lanka", "Sri Lanka", "Australia", "Canada", "UAE"]), region: pick(c.rng, REGIONS), city: pick(c.rng, CITIES), device: pick(c.rng, DEVICES), traffic_source: pick(c.rng, TRAFFIC), referrer: "" };
  },
  analytics: (r, c) => {
    r.project = int(c.rng, 1, COUNTS.projects);
    r.event_type = pick(c.rng, ["view", "view", "view", "save", "lead_submitted", "phone_click", "whatsapp_click", "brochure_download"]);
    r.timestamp = daysAgo(c.rng() * 30);
    r.traffic_source = pick(c.rng, TRAFFIC);
    r.device_type = pick(c.rng, DEVICES);
    r.city = pick(c.rng, CITIES);
  },
  subscriptions: (r, c) => {
    r.developer = c.i < 2 ? 1 : int(c.rng, 2, COUNTS.developers);
    r.package = pick(c.rng, ["featured", "featured-plus", "developer-pro", "campaign"]);
    r.status = c.i < 6 ? "active" : pick(c.rng, ["active", "past_due", "canceled"]);
    r.currency = "LKR";
    r.amount = pick(c.rng, [45000, 95000, 185000, 350000]);
    r.current_period_end = daysAhead(int(c.rng, 4, 300));
  },
  payments: (r, c) => {
    r.payer = { relationTo: "developers", value: c.i < 3 ? 1 : int(c.rng, 2, COUNTS.developers) };
    r.amount = pick(c.rng, [45000, 95000, 185000, 350000]);
    r.currency = "LKR";
    r.status = pick(c.rng, ["completed", "completed", "completed", "pending", "failed"]);
  },
  "team-members": (r, c) => {
    r.company = { relationTo: "developers", value: c.i < 3 ? 1 : int(c.rng, 2, COUNTS.developers) };
    r.email = `${slugify(personName(c.rng)).replace(/-/g, ".")}@${pick(c.rng, DEVELOPERS).domain}`;
    r.status = pick(c.rng, ["active", "active", "invited"]);
  },
  reviews: (r, c) => {
    r.developer = int(c.rng, 1, COUNTS.developers);
    r.rating = int(c.rng, 3, 5);
    r.status = pick(c.rng, ["approved", "approved", "pending"]);
    r.reviewer_name = personName(c.rng);
  },
  "hero-slides": (r, c) => {
    r.headline = `${PROJECTS[c.i]} — now selling`;
    r.advertiser = developerFor(c.i, c.rng);
    r.display_order = c.i + 1;
    r.status = pick(c.rng, ["active", "active", "pending", "archived"]);
    r.start_date = daysAgo(10);
    r.end_date = daysAhead(30);
  },
  "addon-requests": (r, c) => {
    r.developer = c.i < 2 ? 1 : int(c.rng, 2, COUNTS.developers);
    r.status = pick(c.rng, ["requested", "confirmed", "fulfilled"]);
  },
  "placement-pricing": (r, c) => {
    r.tier_name = ["Hero slide, 7 days", "Featured, Colombo", "Featured, sitewide", "Branded residences", "Featured search", "Newsletter slot", "Social post", "Pre-construction", "Colombo luxury", "Hero image"][c.i % 10];
    r.currency = "LKR";
    r.price = pick(c.rng, [15000, 25000, 45000, 75000, 120000]);
    r.active = true;
  },
  neighborhoods: (r, c) => {
    const n = CITIES[c.i % CITIES.length];
    r.name = n;
    r.slug = slugify(n);
  },
  articles: (r, c) => {
    r.title = ["Sri Lanka new-home market, October 2026", "Buying off-plan: what to check", "Foreign ownership rules explained", "Colombo 08 vs Colombo 05", "Payment plans decoded", "Beachfront living in the south", "How to read a floor plan", "Land buying checklist"][c.i % 8];
    r.slug = slugify(String(r.title));
  },
};

function hashSeed(slug: string, i: number) {
  return hash(slug) + i * 9973;
}

export function generateRows(schema: CollectionSchema): Row[] {
  const n = COUNTS[schema.slug] ?? 10;
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const rng = makeRng(hashSeed(schema.slug, i));
    const ctx: Ctx = { slug: schema.slug, i, rng };
    const row: Row = { id: i + 1 };
    fill(schema.fields, row, ctx);
    OVERRIDES[schema.slug]?.(row, ctx);
    if (!row.createdAt) row.createdAt = daysAgo(90 - i, rng);
    if (!row.updatedAt) row.updatedAt = daysAgo(int(rng, 0, 20), rng);
    rows.push(row);
  }
  return rows;
}

export function generateGlobal(fields: SchemaField[], slug: string): Row {
  const rng = makeRng(hash(slug));
  const row: Row = { id: 1 };
  fill(fields, row, { slug, i: 0, rng });
  return row;
}

/** A blank record for "Create new": defaults only. */
export function blankRow(fields: SchemaField[], slug: string): Row {
  const row: Row = { id: "new" };
  const walk = (list: SchemaField[], target: Record<string, unknown>) => {
    for (const f of list) {
      if (f.type === "tabs") {
        for (const tab of f.tabs ?? []) {
          if (tab.name) {
            const sub: Record<string, unknown> = {};
            walk(tab.fields, sub);
            target[tab.name] = sub;
          } else walk(tab.fields, target);
        }
      } else if (f.type === "row" || f.type === "collapsible") walk(f.fields ?? [], target);
      else if (f.name && f.type !== "ui" && f.type !== "join") {
        if (f.type === "group") {
          const sub: Record<string, unknown> = {};
          walk(f.fields ?? [], sub);
          target[f.name] = sub;
        } else if (f.type === "array") target[f.name] = [];
        else if (f.defaultValue !== undefined) target[f.name] = f.defaultValue;
        else if (f.type === "checkbox") target[f.name] = false;
        else target[f.name] = f.hasMany ? [] : null;
      }
    }
  };
  walk(fields, row);
  void slug;
  return row;
}

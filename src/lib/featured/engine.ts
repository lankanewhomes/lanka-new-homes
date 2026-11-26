// Pure selection logic for the Featured placements. No database, no React: everything here takes plain data in and returns plain data,
// so the rules (order, rotation, matching, caps) are unit-tested in engine.test.ts.
import type { Project } from "@/types";
import { MAX_PINNED_PER_PAGE, PLACEMENT_MIN_TIER, TIER_ORDER, TIER_RANK, type FeaturedTier, type Placement } from "./config";
import type { AddOnBooking, FeaturedItem, FeaturedPackage, FeaturedState, SlotContext } from "./types";

export const toDay = (date: Date) => date.toISOString().slice(0, 10);

export function isActive(startDate: string, endDate: string, now: Date): boolean {
  const today = toDay(now);
  return startDate <= today && endDate >= today;
}

export const activePackages = (state: FeaturedState, now: Date) => state.packages.filter((pkg) => isActive(pkg.startDate, pkg.endDate, now));
export const activeBookings = (state: FeaturedState, now: Date, type?: AddOnBooking["type"]) =>
  state.bookings.filter((booking) => (!type || booking.type === type) && isActive(booking.startDate, booking.endDate, now));

const norm = (text: string | undefined) => (text ?? "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

/** Does this project sit in the named place? Checks location, city, district and neighbourhood. */
export function matchesLocation(project: Pick<Project, "location" | "city" | "district" | "neighborhood">, place: string | undefined): boolean {
  if (!place) return true;
  const needle = norm(place);
  if (!needle) return true;
  return [project.location, project.city, project.district, project.neighborhood].some((field) => {
    const value = norm(field);
    return value === needle || ` ${value} `.includes(` ${needle} `);
  });
}

// "Apartments" pages also suit condominiums and the other way round: buyers use the words interchangeably.
const TYPE_GROUPS: string[][] = [["apartments", "apartment", "condominium", "condo", "flat", "flats"], ["villas", "villa"], ["housing", "house", "houses", "townhouse", "townhouses"]];
export function matchesType(project: Pick<Project, "type">, type: string | undefined): boolean {
  if (!type) return true;
  const a = norm(project.type);
  const b = norm(type);
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return TYPE_GROUPS.some((group) => group.some((word) => a.split(" ").includes(word)) && group.some((word) => b.split(" ").includes(word)));
}

export function matchesTags(project: Project, tags: string[] | undefined): boolean {
  if (!tags?.length) return true;
  const hay = norm([project.name, project.type, project.location, project.city, project.summary, (project.highlights ?? []).join(" "), (project.marketingBadges ?? []).join(" "), (project.locationBadges ?? []).join(" ")].join(" "));
  return tags.some((tag) => hay.includes(norm(tag)));
}

export function matchesContext(project: Project, ctx: SlotContext): boolean {
  return matchesLocation(project, ctx.location) && matchesType(project, ctx.type) && matchesTags(project, ctx.tags);
}

/** FNV-1a: a stable number from a string, used to give each slot its own rotation. */
export function hashString(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** The rotation changes once an hour. Page caches last a minute, so a visitor sees a stable page while the order still moves fairly. */
export const rotationBucket = (now: Date) => Math.floor(now.getTime() / 3_600_000);

/**
 * Orders one tier's items fairly: developers take turns (a developer with 6 projects does not fill every pinned spot), the developer
 * order rotates by the hour bucket, and the second project of each developer comes only after every developer has had a first.
 */
export function rotateFairly(items: FeaturedItem[], bucket: number, salt = ""): FeaturedItem[] {
  const byDeveloper = new Map<string, FeaturedItem[]>();
  for (const item of items) byDeveloper.set(item.developerSlug, [...(byDeveloper.get(item.developerSlug) ?? []), item]);
  const developers = [...byDeveloper.keys()].sort();
  if (!developers.length) return [];
  const offset = (bucket + hashString(salt)) % developers.length;
  const turnOrder = [...developers.slice(offset), ...developers.slice(0, offset)];
  const out: FeaturedItem[] = [];
  const rounds = Math.max(...[...byDeveloper.values()].map((list) => list.length));
  for (let round = 0; round < rounds; round += 1) {
    for (const developer of turnOrder) {
      const list = byDeveloper.get(developer) ?? [];
      // Within a developer the chosen-project order also moves a step each hour so every slot gets its share of the first spot.
      const pick = list[(round + bucket) % list.length];
      if (pick && !out.includes(pick)) out.push(pick);
    }
  }
  // Safety net: anything skipped by the modulo above still appears (after the others).
  for (const item of items) if (!out.includes(item)) out.push(item);
  return out;
}

/** Tier order (elite, premium, featured), fair rotation inside each tier. */
export function orderFeatured(items: FeaturedItem[], now: Date, salt = ""): FeaturedItem[] {
  const bucket = rotationBucket(now);
  return TIER_ORDER.flatMap((tier) => rotateFairly(items.filter((item) => item.tier === tier), bucket, `${salt}:${tier}`));
}

/** Every project currently filling a slot of an active package, one entry per project (best tier wins if a project is in two packages). */
export function activeItems(state: FeaturedState, projects: Project[], now: Date): FeaturedItem[] {
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const items = new Map<string, FeaturedItem>();
  for (const pkg of activePackages(state, now)) {
    for (const slug of pkg.projectSlugs.slice(0, pkg.slots)) {
      const project = bySlug.get(slug);
      if (!project || project.isPublished === false || project.status === ("Sold Out" as string)) continue;
      const existing = items.get(slug);
      if (existing && TIER_RANK[existing.tier] >= TIER_RANK[pkg.tier]) continue;
      items.set(slug, { project, tier: pkg.tier, packageId: pkg.id, developerSlug: pkg.developerSlug });
    }
  }
  return [...items.values()];
}

/** True when this developer has an active Elite package: their project pages show no other developer's featured projects. */
export function isCompetitorFree(state: FeaturedState, developerSlug: string | undefined, now: Date): boolean {
  if (!developerSlug) return false;
  return activePackages(state, now).some((pkg) => pkg.developerSlug === developerSlug && pkg.tier === "elite");
}

const COMPETITOR_FREE_PLACEMENTS = new Set<Placement>(["project-similar", "project-nearby", "thankyou-also-like", "results-inline"]);

/**
 * The main entry point: which featured projects may appear in `placement` on a page described by `ctx`.
 * Rules: tier gate for the placement, same location/type as the page, elite > premium > featured, fair rotation inside a tier,
 * never the page's own project, pinned lists capped at 3, empty list = the slot renders nothing.
 */
export function selectFeatured(state: FeaturedState, projects: Project[], placement: Placement, ctx: SlotContext = {}): FeaturedItem[] {
  const now = ctx.now ?? new Date();
  const minTier = PLACEMENT_MIN_TIER[placement] ?? "featured";
  let items = activeItems(state, projects, now).filter((item) => TIER_RANK[item.tier] >= TIER_RANK[minTier]);
  items = items.filter((item) => matchesContext(item.project, ctx));
  if (ctx.projectSlug) items = items.filter((item) => item.project.slug !== ctx.projectSlug);
  if (COMPETITOR_FREE_PLACEMENTS.has(placement) && isCompetitorFree(state, ctx.developerSlug, now)) {
    items = items.filter((item) => item.developerSlug === ctx.developerSlug);
  }
  const cap = placement === "results-top" ? Math.min(ctx.limit ?? MAX_PINNED_PER_PAGE, MAX_PINNED_PER_PAGE) : ctx.limit ?? 12;
  return orderFeatured(items, now, placement).slice(0, cap);
}

/** Developers with an active package of at least the placement's tier, best tier first, rotated fairly. */
export function featuredDevelopers(state: FeaturedState, placement: Placement, now = new Date(), limit = 12): { developerSlug: string; tier: FeaturedTier }[] {
  const minTier = PLACEMENT_MIN_TIER[placement] ?? "featured";
  const best = new Map<string, FeaturedTier>();
  for (const pkg of activePackages(state, now)) {
    if (TIER_RANK[pkg.tier] < TIER_RANK[minTier]) continue;
    const have = best.get(pkg.developerSlug);
    if (!have || TIER_RANK[pkg.tier] > TIER_RANK[have]) best.set(pkg.developerSlug, pkg.tier);
  }
  const pseudo: FeaturedItem[] = [...best].map(([developerSlug, tier]) => ({ developerSlug, tier, packageId: developerSlug, project: undefined as unknown as Project }));
  return orderFeatured(pseudo, now, placement).slice(0, limit).map(({ developerSlug, tier }) => ({ developerSlug, tier }));
}

/** A full http(s) web address, or undefined: the only kind of link a "website-link" booking may carry. */
export function websiteUrl(value: string | undefined): string | undefined {
  try {
    const url = new URL((value ?? "").trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The developer's own website for a Featured search card ("website-link" add-on), if they have an active booking. A booking with a
 * project applies to that project only; one without a project covers every project of the developer (the project one wins).
 */
export function websiteLinkFor(state: FeaturedState, developerSlug: string, projectSlug: string, now = new Date()): string | undefined {
  const bookings = activeBookings(state, now, "website-link").filter((booking) => booking.developerSlug === developerSlug);
  const pick = bookings.find((booking) => booking.projectSlug === projectSlug) ?? bookings.find((booking) => !booking.projectSlug);
  return websiteUrl(pick?.creative?.ctaHref);
}

/** Which week of the month it is (0-3); the 29th-31st count as week 3. */
export const weekOfMonth = (now: Date) => Math.min(3, Math.floor((now.getUTCDate() - 1) / 7));

/** Elite packages get one hero week a month: this returns the elite packages whose week it is now. */
export function eliteHeroPackages(state: FeaturedState, now: Date): FeaturedPackage[] {
  const week = weekOfMonth(now);
  return activePackages(state, now).filter((pkg) => pkg.tier === "elite" && hashString(pkg.id) % 4 === week);
}

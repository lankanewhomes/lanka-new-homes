import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { searchablePages } from "@/lib/listing-categories";
import { getFeaturedData } from "@/lib/featured/store";
import { selectFeatured, websiteLinkFor } from "@/lib/featured/engine";
import type { FeaturedItem, FeaturedState } from "@/lib/featured/types";
import type { FeaturedSuggestion } from "@/components/featured/search-featured";

// Header search dropdown: projects, land, developers and cities matching what was typed. A small in-memory index
// (refreshed every minute) keeps keystrokes from hitting Supabase each time.
type Suggestion = { label: string; detail: string; href: string; sponsored?: boolean; developer?: string };
const MAX_FEATURED_CARDS = 4;
// Collection pages (Luxury, Beachfront, Villas, Pre-construction, Apartments...) found by their words, not their exact title.
const extraCollections: { label: string; href: string; keywords: string }[] = [
  { label: "Apartments for sale", href: "/projects?type=Apartments", keywords: "apartment apartments condo condominium flat flats" },
  { label: "Houses for sale", href: "/projects?type=House", keywords: "house houses home homes" },
  { label: "All developers", href: "/developers", keywords: "developer developers builder builders" },
];
const wordsOf = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
function matchCollections(q: string): Suggestion[] {
  const all = [
    ...extraCollections,
    ...searchablePages.map((page) => ({ label: page.label, href: page.path, keywords: page.keywords })),
  ];
  const typed = wordsOf(q);
  if (!typed.length) return [];
  return all
    .filter((page) => {
      const hay = `${page.label} ${page.keywords}`.toLowerCase();
      const words = wordsOf(hay);
      // every typed word must start a word in the page's keywords ("pre con" -> pre-construction), or the whole phrase appears
      return hay.includes(q) || typed.every((t) => words.some((w) => w.startsWith(t) || (t.length >= 3 && t.startsWith(w) && w.length >= 3)));
    })
    .map((page) => ({ label: page.label, detail: "Listings", href: page.href }));
}

let cache: { at: number; items: Suggestion[] } | null = null;

async function loadIndex(): Promise<Suggestion[]> {
  if (cache && Date.now() - cache.at < 60_000) return cache.items;
  const [projects, lands, developers] = await Promise.all([getAllProjects(), getAllLands(), getAllDevelopers()]);
  const items: Suggestion[] = [];
  const cities = new Set<string>();
  for (const p of projects) {
    items.push({ label: p.name, detail: "Project", href: `/projects/${p.slug}` });
    if (p.city) cities.add(p.city);
  }
  for (const l of lands) {
    items.push({ label: l.title, detail: "Land", href: `/land/${l.slug}` });
    if (l.city) cities.add(l.city);
  }
  for (const d of developers) {
    if (String(d.slug).startsWith("test-badge-")) continue;
    items.push({ label: d.name, detail: "Developer", href: `/developers/${d.slug}` });
  }
  for (const city of cities) items.unshift({ label: city, detail: "City", href: `/search?q=${encodeURIComponent(city)}` });
  cache = { at: Date.now(), items };
  return items;
}

/** Featured projects as photo cards for the search drop-downs: the order they arrive in (best tier first, fair rotation), at most MAX_FEATURED_CARDS. */
function toCards(state: FeaturedState, items: FeaturedItem[]): FeaturedSuggestion[] {
  return items.filter((item) => item.project.heroImage).slice(0, MAX_FEATURED_CARDS).map((item) => ({
    slug: item.project.slug,
    name: item.project.name,
    place: item.project.location || item.project.city || "",
    href: `/projects/${item.project.slug}`,
    image: item.project.heroImage,
    developer: item.developerSlug,
    tier: item.tier,
    website: websiteLinkFor(state, item.developerSlug, item.project.slug), // paid "website-link" add-on only
  }));
}

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
  // Nothing typed yet: no suggestions, but the Featured cards still show as soon as the search opens (owner, 2026-11-26).
  if (q.length < 2) {
    let featured: FeaturedSuggestion[] = [];
    try {
      const { state, projects } = await getFeaturedData();
      featured = toCards(state, selectFeatured(state, projects, "search-autocomplete", { limit: 40 }));
    } catch {
      // never let an ad lookup break search
    }
    return NextResponse.json({ suggestions: [], featured });
  }
  const items = await loadIndex();
  const starts = items.filter((item) => item.label?.toLowerCase().startsWith(q));
  const contains = items.filter((item) => item.label?.toLowerCase().includes(q) && !item.label.toLowerCase().startsWith(q));
  const collections = matchCollections(q).slice(0, 4);
  const seen = new Set(collections.map((c) => c.href));
  const rest = [...starts, ...contains].filter((item) => !seen.has(item.href));
  const organic = [...collections, ...rest].slice(0, 7);

  // Paid placement: one sponsored suggestion (Premium and Elite) whose name, place or type matches what was typed. Always labelled.
  // `featured` carries the same matches as photo cards (best tier first, fair rotation, at most MAX_FEATURED_CARDS) for the phone search pop-up.
  let sponsored: Suggestion | undefined;
  let featured: FeaturedSuggestion[] = [];
  try {
    const { state, projects } = await getFeaturedData();
    const hits = selectFeatured(state, projects, "search-autocomplete", { limit: 40 }).filter((item) => {
      const hay = `${item.project.name} ${item.project.location} ${item.project.city} ${item.project.type} ${item.project.developerName}`.toLowerCase();
      return hay.includes(q) || wordsOf(q).every((word) => hay.includes(word));
    });
    const [hit] = hits;
    if (hit) sponsored = { label: hit.project.name, detail: "Sponsored", href: `/projects/${hit.project.slug}`, sponsored: true, developer: hit.developerSlug };
    featured = toCards(state, hits);
  } catch {
    // never let an ad lookup break search
  }
  return NextResponse.json({ suggestions: sponsored ? [sponsored, ...organic.filter((item) => item.href !== sponsored.href)] : organic, featured });
}

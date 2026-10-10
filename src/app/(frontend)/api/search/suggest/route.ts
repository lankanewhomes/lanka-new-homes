import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";
import { searchablePages } from "@/lib/listing-categories";

// Header search dropdown: projects, land, developers and cities matching what was typed. A small in-memory index
// (refreshed every minute) keeps keystrokes from hitting Supabase each time.
type Suggestion = { label: string; detail: string; href: string };
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

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ suggestions: [] });
  const items = await loadIndex();
  const starts = items.filter((item) => item.label?.toLowerCase().startsWith(q));
  const contains = items.filter((item) => item.label?.toLowerCase().includes(q) && !item.label.toLowerCase().startsWith(q));
  const collections = matchCollections(q).slice(0, 4);
  const seen = new Set(collections.map((c) => c.href));
  const rest = [...starts, ...contains].filter((item) => !seen.has(item.href));
  return NextResponse.json({ suggestions: [...collections, ...rest].slice(0, 8) });
}

import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { getAllDevelopers } from "@/lib/developer-store";

// Header search dropdown: projects, land, developers and cities matching what was typed. A small in-memory index
// (refreshed every minute) keeps keystrokes from hitting Supabase each time.
type Suggestion = { label: string; detail: string; href: string };
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
  return NextResponse.json({ suggestions: [...starts, ...contains].slice(0, 8) });
}

import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";

// Photo tiles on the right of the header mega menu ("Featured listings"). Up to four projects and four lands:
// the ones marked Featured first, topped up with the best-scored listings so the block is never empty.
// Sold-out listings are never shown. Loaded once when the menu first opens; cached for five minutes.
export type NavTile = { name: string; place: string; href: string; image: string; featured: boolean };
const TILES = 4;

let cache: { at: number; body: { projects: NavTile[]; lands: NavTile[] } } | null = null;

function pick<T extends { isFeatured?: boolean; heroImage?: string }>(items: T[], score: (item: T) => number): T[] {
  const withPhoto = items.filter((item) => item.heroImage);
  const byScore = (a: T, b: T) => score(b) - score(a);
  const featured = withPhoto.filter((item) => item.isFeatured).sort(byScore);
  const rest = withPhoto.filter((item) => !item.isFeatured).sort(byScore);
  return [...featured, ...rest].slice(0, TILES);
}

export async function GET() {
  if (!cache || Date.now() - cache.at > 300_000) {
    const [projects, lands] = await Promise.all([getAllProjects(), getAllLands()]);
    const openProjects = projects.filter((project) => !project.isLand && String(project.status) !== "Sold Out");
    const openLands = lands.filter((land) => land.status !== "Sold");
    cache = {
      at: Date.now(),
      body: {
        projects: pick(openProjects, (project) => project.finalScore ?? 0).map((project) => ({
          name: project.name,
          place: project.city ?? "",
          href: `/projects/${project.slug}`,
          image: project.heroImage,
          featured: Boolean(project.isFeatured),
        })),
        lands: pick(openLands, () => 0).map((land) => ({
          name: land.title,
          place: land.city ?? "",
          href: `/land/${land.slug}`,
          image: land.heroImage,
          featured: Boolean(land.isFeatured),
        })),
      },
    };
  }
  return NextResponse.json(cache.body, { headers: { "Cache-Control": "public, max-age=300" } });
}

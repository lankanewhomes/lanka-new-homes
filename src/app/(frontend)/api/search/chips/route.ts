import { NextResponse } from "next/server";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { rankQuickChips } from "@/lib/search-chips";

// The quick chips under the search boxes, ordered by how many listings each one has (see src/lib/search-chips.ts). Cached for a few minutes.
let cache: { at: number; chips: { label: string; href: string; count: number }[] } | null = null;

export async function GET() {
  if (!cache || Date.now() - cache.at > 5 * 60 * 1000) {
    const [projects, lands] = await Promise.all([getAllProjects(), getAllLands()]);
    cache = { at: Date.now(), chips: rankQuickChips(projects, lands) };
  }
  return NextResponse.json({ chips: cache.chips }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}

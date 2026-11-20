import { NextResponse } from "next/server";
import { getFeaturedData } from "@/lib/featured/store";
import { selectFeatured } from "@/lib/featured/engine";
import { slimForHome } from "@/lib/home-slim";

// "You may also like" shown inside the enquiry / brochure thank-you state: featured projects near the one the visitor just asked about.
export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const { state, projects } = await getFeaturedData();
  const current = projects.find((project) => project.slug === slug);
  if (!current) return NextResponse.json({ items: [] });
  const items = selectFeatured(state, projects, "thankyou-also-like", { location: current.city || current.location, type: current.type, projectSlug: slug, developerSlug: current.developerSlug, limit: 3 });
  return NextResponse.json({
    demo: state.demo,
    items: items.map((item) => ({ project: slimForHome(item.project), tier: item.tier, developer: item.developerSlug })),
  });
}

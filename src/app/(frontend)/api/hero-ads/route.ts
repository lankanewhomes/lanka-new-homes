import { NextResponse } from "next/server";
import { createHeroAdRequest, getActiveHeroAds, getAllHeroAds, getHeroAdsForDeveloper } from "@/lib/hero-ad-store";
import { getCurrentProfile } from "@/lib/auth";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getProjectBySlug } from "@/lib/project-store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const developerSlug = searchParams.get("developerSlug");
  const activeOnly = searchParams.get("active") === "1";

  if (activeOnly) {
    const ads = await getActiveHeroAds();
    return NextResponse.json({ ads });
  }

  const ads = developerSlug ? await getHeroAdsForDeveloper(developerSlug) : await getAllHeroAds();
  return NextResponse.json({ ads });
}

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "developer" || !profile.developerSlug) {
    return NextResponse.json({ error: "Developer sign-in is required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const requiredFields = ["developerSlug", "developerName", "projectSlug", "image", "headline", "linkUrl", "startDate", "endDate", "priceLkr"] as const;
  for (const field of requiredFields) {
    if (!body[field]) return NextResponse.json({ error: `${field} is required` }, { status: 400 });
  }

  if (String(body.endDate) < String(body.startDate)) {
    return NextResponse.json({ error: "End date must be on or after the start date" }, { status: 400 });
  }

  const priceLkr = Number(body.priceLkr);
  if (!Number.isFinite(priceLkr) || priceLkr <= 0) {
    return NextResponse.json({ error: "A paid placement price greater than zero is required" }, { status: 400 });
  }

  const project = await getProjectBySlug(String(body.projectSlug));
  if (!project || project.developerSlug !== profile.developerSlug) {
    return NextResponse.json({ error: "You can only request a placement for one of your projects" }, { status: 403 });
  }

  const developer = await getDeveloperBySlug(profile.developerSlug);

  const ad = await createHeroAdRequest({
    developerSlug: profile.developerSlug,
    developerName: developer?.name ?? project.developerName,
    projectSlug: project.slug,
    image: String(body.image),
    headline: String(body.headline),
    linkUrl: String(body.linkUrl),
    startDate: String(body.startDate),
    endDate: String(body.endDate),
    priceLkr,
  });

  return NextResponse.json({ ok: true, ad }, { status: 201 });
}

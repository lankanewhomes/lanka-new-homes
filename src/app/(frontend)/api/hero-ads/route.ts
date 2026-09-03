import { NextResponse } from "next/server";
import { createHeroAdRequest, getActiveHeroAds, getAllHeroAds, getHeroAdsForDeveloper } from "@/lib/hero-ad-store";

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

  const ad = await createHeroAdRequest({
    developerSlug: String(body.developerSlug),
    developerName: String(body.developerName),
    projectSlug: body.projectSlug ? String(body.projectSlug) : undefined,
    image: String(body.image),
    headline: String(body.headline),
    linkUrl: String(body.linkUrl),
    startDate: String(body.startDate),
    endDate: String(body.endDate),
    priceLkr,
  });

  return NextResponse.json({ ok: true, ad }, { status: 201 });
}

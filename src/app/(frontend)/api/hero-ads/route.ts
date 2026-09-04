import { NextResponse } from "next/server";
import { getActiveHeroAds } from "@/lib/hero-ad-store";

export async function GET() {
  const ads = await getActiveHeroAds();
  return NextResponse.json({ ads });
}

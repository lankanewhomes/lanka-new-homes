import { NextResponse } from "next/server";
import { getDeveloperDashboardStats } from "@/lib/tracking-db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const developerSlug = searchParams.get("developerSlug");

  if (!developerSlug) {
    return NextResponse.json({ error: "developerSlug is required" }, { status: 400 });
  }

  const stats = getDeveloperDashboardStats(developerSlug);
  return NextResponse.json({ ok: true, stats });
}

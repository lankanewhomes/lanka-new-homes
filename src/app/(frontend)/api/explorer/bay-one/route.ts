import { NextResponse } from "next/server";
import { loadBayOneStatuses } from "@/lib/bay-one-availability";

// Live availability for the Bay One Apartment Explorer (see src/lib/bay-one-availability.ts). Cached 30 minutes in memory and by the
// CDN. If the developer's page can't be read or changes shape, this answers 502 and the explorer keeps its built-in snapshot.
export async function GET() {
  try {
    const { at, statuses } = await loadBayOneStatuses();
    return NextResponse.json({ updatedAt: new Date(at).toISOString(), statuses }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

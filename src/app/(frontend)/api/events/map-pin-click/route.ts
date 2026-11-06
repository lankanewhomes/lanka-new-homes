import { NextResponse } from "next/server";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

// Fire-and-forget from a map pin tap (MapPane) — logs an Analytics "map_pin_click" event for the listing (project or land).
// Not deferred with after(), so the dedup check cannot race a second rapid tap.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const projectSlug = body?.projectSlug;
  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
  }

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: "map_pin_click",
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
        utm: body.utm,
    });
  } catch (error) {
    console.error("Failed to log map_pin_click analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

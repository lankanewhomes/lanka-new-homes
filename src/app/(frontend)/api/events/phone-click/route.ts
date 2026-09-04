import { NextResponse } from "next/server";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

// Fire-and-forget from a tel: link's onClick (StatsContactCard,
// ListingSidebarCard) — logs an Analytics "phone_click" event. The caller
// never awaits this fetch (the tel: navigation isn't gated on it), so
// there's no perceived-latency reason to defer the write with after() —
// and deferring it would race the dedup check against a second rapid
// click, since after() callbacks aren't ordered relative to the next
// incoming request.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const projectSlug = body?.projectSlug;
  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
  }

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: "phone_click",
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
    });
  } catch (error) {
    console.error("Failed to log phone_click analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

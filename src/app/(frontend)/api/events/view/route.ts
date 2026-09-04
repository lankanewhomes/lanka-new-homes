import { NextResponse } from "next/server";
import { trackProjectView } from "@/lib/tracking-db";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body?.projectSlug || !body?.developerSlug || !body?.sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await trackProjectView({
      projectSlug: String(body.projectSlug),
      developerSlug: String(body.developerSlug),
      sessionId: String(body.sessionId),
    });

    // Mirror into Payload's Analytics collection (previously this route only
    // wrote to Supabase's project_views table — Payload's view_count never
    // moved for real traffic). Not deferred with after(): the caller
    // (ProjectViewTracker) never awaits this fetch anyway, so there's no
    // perceived-latency reason to, and awaiting it here keeps the dedup
    // check's read-then-write from racing a rapid second view/refresh from
    // the same session.
    try {
      await logRawAnalyticsEvent(req, {
        projectSlug: String(body.projectSlug),
        eventType: "view",
        sessionId: body.sessionId,
        trafficSource: body.trafficSource,
      });
    } catch (error) {
      console.error("Failed to log view analytics event", error);
    }

    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch {
    return NextResponse.json({ error: "Failed to track view" }, { status: 500 });
  }
}

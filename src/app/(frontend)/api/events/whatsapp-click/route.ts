import { NextResponse } from "next/server";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

// Fire-and-forget from the WhatsApp click-to-chat button on listing pages
// (ProjectHero, StatsContactCard, SalesCenterSection) — logs an Analytics
// "whatsapp_click" event, the same way phone-click does for tel: links. The
// wa.me navigation isn't gated on this, so it's not deferred with after().
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const projectSlug = body?.projectSlug;
  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
  }

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: "whatsapp_click",
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
    });
  } catch (error) {
    console.error("Failed to log whatsapp_click analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

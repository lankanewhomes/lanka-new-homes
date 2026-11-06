import { NextResponse } from "next/server";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

const ALLOWED = new Set(["map_pin_click", "compare_add", "compare_remove", "form_field_focus", "save"]);

// Fire-and-forget from the listing pages (see src/lib/log-interaction.ts): a map pin tap, adding/removing a listing from compare, or
// tapping a field of the inquiry form (the field name is kept in source_page). Works for projects and land plots.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const projectSlug = body?.projectSlug;
  const eventType = body?.eventType;
  if (!projectSlug || typeof projectSlug !== "string" || typeof eventType !== "string" || !ALLOWED.has(eventType)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  const detail = typeof body.detail === "string" && body.detail.trim() ? body.detail.trim().slice(0, 60) : undefined;

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: eventType as "map_pin_click" | "compare_add" | "compare_remove" | "form_field_focus" | "save",
      sourcePage: detail,
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
      utm: body.utm,
    });
  } catch (error) {
    console.error("Failed to log interaction analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

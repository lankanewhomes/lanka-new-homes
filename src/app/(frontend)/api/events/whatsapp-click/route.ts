import { NextResponse } from "next/server";
import { logRawAnalyticsEvent } from "@/lib/analytics-event";

async function firstProjectSlugOfDeveloper(developerSlug: string): Promise<string | undefined> {
  try {
    const { getPayload } = await import("payload");
    const payloadConfig = (await import("../../../../../../payload.config")).default;
    const payload = await getPayload({ config: payloadConfig });
    const developer = (await payload.find({ collection: "developers", where: { slug: { equals: developerSlug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    if (!developer) return undefined;
    const project = (await payload.find({ collection: "projects", where: { developer: { equals: developer.id } }, limit: 1, depth: 0, overrideAccess: true })).docs[0];
    return project?.slug ?? undefined;
  } catch {
    return undefined;
  }
}

// Fire-and-forget from the WhatsApp click-to-chat button on listing pages
// (ProjectHero, StatsContactCard, SalesCenterSection) — logs an Analytics
// "whatsapp_click" event, The
// wa.me navigation isn't gated on this, so it's not deferred with after().
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  let projectSlug = body?.projectSlug;
  let sourcePage: string | undefined;
  // A tap on the WhatsApp icon of a developer's profile page has no listing: attribute it to the developer through their first listing,
  // marked as a profile-page click (owner, 2026-11-04).
  if ((!projectSlug || typeof projectSlug !== "string") && typeof body?.developerSlug === "string") {
    projectSlug = await firstProjectSlugOfDeveloper(body.developerSlug);
    sourcePage = "developer-profile";
  }
  if (!projectSlug || typeof projectSlug !== "string") {
    return NextResponse.json({ error: "Missing projectSlug" }, { status: 400 });
  }

  try {
    await logRawAnalyticsEvent(req, {
      projectSlug,
      eventType: "whatsapp_click",
      sourcePage,
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
        utm: body.utm,
    });
  } catch (error) {
    console.error("Failed to log whatsapp_click analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

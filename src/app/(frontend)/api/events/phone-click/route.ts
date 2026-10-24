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

// Fire-and-forget from a tel: link's onClick (StatsContactCard,
// ListingSidebarCard) — logs an Analytics "phone_click" event. The caller
// never awaits this fetch (the tel: navigation isn't gated on it), so
// there's no perceived-latency reason to defer the write with after() —
// and deferring it would race the dedup check against a second rapid
// click, since after() callbacks aren't ordered relative to the next
// incoming request.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  let projectSlug = body?.projectSlug;
  let sourcePage: string | undefined;
  // A call from a developer's profile page has no listing: attribute it to the developer through their first listing, marked as a
  // profile-page click (owner, 2026-10-24: "make sure you track this number also").
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
      eventType: "phone_click",
      sourcePage,
      sessionId: body.sessionId,
      trafficSource: body.trafficSource,
        utm: body.utm,
    });
  } catch (error) {
    console.error("Failed to log phone_click analytics event", error);
  }

  return NextResponse.json({ ok: true });
}

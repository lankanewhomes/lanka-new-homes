import type { Payload } from "payload";

// Server-side helpers for enriching an Analytics event with request-derived
// metadata (geo, device, bot detection) — used by every route that logs an
// event (view, brochure download, phone click, lead submit).

export type EventEnrichment = {
  session_id?: string;
  traffic_source?: string;
  referrer?: string;
  city?: string;
  region?: string;
  device_type: "desktop" | "mobile" | "tablet" | "unknown";
  is_bot: boolean;
};

// Vercel populates these on every request at the edge — no third-party geo-IP
// service needed. Falls back to empty strings off Vercel (e.g. local dev),
// where the event is still logged, just without a location.
export function getRequestGeo(headers: Headers): { city?: string; region?: string } {
  const city = headers.get("x-vercel-ip-city");
  const region = headers.get("x-vercel-ip-country-region");
  return {
    city: city ? decodeURIComponent(city) : undefined,
    region: region ? decodeURIComponent(region) : undefined,
  };
}

export function classifyDeviceType(userAgent: string | null): EventEnrichment["device_type"] {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet(?!.*mobile)|kindle|playbook/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";
  return "desktop";
}

const BOT_UA_PATTERN = /bot|crawl|spider|slurp|headless|phantomjs|puppeteer|playwright|curl|wget|python-requests|monitor|pingdom|uptimerobot/i;

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return true; // no UA at all — treat as suspicious, not a real browser
  return BOT_UA_PATTERN.test(userAgent);
}

// Server-side fallback classification from the Referer header — used only
// when the client didn't supply its own (more accurate, session-persisted)
// traffic_source via src/lib/ga4.ts's getTrafficSource(). Mirrors the same
// channel buckets so the two sources stay comparable.
export function classifyReferrer(referrer: string | null, siteHost: string): string {
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (host === siteHost) return "direct";
    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(host)) return "organic_search";
    if (/facebook\.|instagram\.|linkedin\.|twitter\.|x\.com|tiktok\./.test(host)) return "organic_social";
    return "referral";
  } catch {
    return "direct";
  }
}

export function buildEventEnrichment(request: Request, body: { sessionId?: unknown; trafficSource?: unknown }): EventEnrichment {
  const userAgent = request.headers.get("user-agent");
  const referrer = request.headers.get("referer");
  const { city, region } = getRequestGeo(request.headers);
  const siteHost = new URL(request.url).host;

  return {
    session_id: typeof body.sessionId === "string" ? body.sessionId : undefined,
    traffic_source: typeof body.trafficSource === "string" ? body.trafficSource : classifyReferrer(referrer, siteHost),
    referrer: referrer ?? undefined,
    city,
    region,
    device_type: classifyDeviceType(userAgent),
    is_bot: isBotUserAgent(userAgent),
  };
}

async function getPayloadInstance(): Promise<Payload> {
  const { getPayload } = await import("payload");
  const payloadConfig = (await import("../../payload.config")).default;
  return getPayload({ config: payloadConfig });
}

// Shared by every route that logs a raw Analytics event server-side (view,
// brochure download, phone click) — resolves the project by slug, attaches
// request-derived enrichment, and creates the event via Payload's Local API.
// Silently no-ops if the project can't be resolved (never blocks the
// visitor-facing action this is attached to).
export async function logRawAnalyticsEvent(
  request: Request,
  args: { projectSlug: string; eventType: "view" | "brochure_download" | "phone_click"; sourcePage?: string; sessionId?: unknown; trafficSource?: unknown },
): Promise<void> {
  const payload = await getPayloadInstance();
  const projectRes = await payload.find({
    collection: "projects",
    where: { slug: { equals: args.projectSlug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const projectDoc = projectRes.docs[0];
  if (!projectDoc) return;

  const enrichment = buildEventEnrichment(request, { sessionId: args.sessionId, trafficSource: args.trafficSource });

  await payload.create({
    collection: "analytics",
    data: {
      project: projectDoc.id,
      event_type: args.eventType,
      source_page: args.sourcePage,
      ...enrichment,
    } as never,
    overrideAccess: true,
  });
}

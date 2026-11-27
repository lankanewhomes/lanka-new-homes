"use client";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { isAiAssistantHost, isAiAssistantUtmSource } from "@/lib/ai-traffic";
import { cleanSearchString, pageContentCategory, trackCustomEvent as trackMetaCustom, trackEvent as trackMetaPixel } from "@/lib/metaPixel";

import { sendGAEvent } from "@next/third-parties/google";

const UTM_SESSION_KEY = "lnh-utm-session";
const LANDING_SESSION_KEY = "lnh-landing-page";

type UtmParams = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
};

// Captures utm_source/medium/campaign from the landing URL into
// sessionStorage on first load — GA4's own gtag.js already attributes the
// session from these automatically, but our own custom events (generate_lead)
// need to carry utm_campaign explicitly, and later client-side navigation
// away from the landing URL would otherwise lose it. First-touch-per-session:
// never overwrites what's already stored.
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  try {
    // First page of the session, so a lead can be traced back to the page that brought the visitor in.
    if (!sessionStorage.getItem(LANDING_SESSION_KEY)) sessionStorage.setItem(LANDING_SESSION_KEY, window.location.pathname);
  } catch {
    // sessionStorage unavailable — no-op.
  }
  try {
    if (sessionStorage.getItem(UTM_SESSION_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: UtmParams = {};
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const campaign = params.get("utm_campaign");
    if (source) utm.utm_source = source;
    if (medium) utm.utm_medium = medium;
    if (campaign) utm.utm_campaign = campaign;
    sessionStorage.setItem(UTM_SESSION_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage unavailable (private mode, blocked storage) — no-op.
  }
}

/** Path of the first page this visitor opened in this session (falls back to the current page). */
export function getLandingPage(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(LANDING_SESSION_KEY) || window.location.pathname;
  } catch {
    return window.location.pathname;
  }
}

export function getStoredUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_SESSION_KEY);
    return raw ? (JSON.parse(raw) as UtmParams) : {};
  } catch {
    return {};
  }
}

// Simplified version of GA4's own Default Channel Group, derived from the
// same first-touch UTM params plus document.referrer — used to label our
// own custom events (GA4's own session-scoped attribution already happens
// automatically inside GA4 itself from the same signals).
export function getTrafficSource(): string {
  if (typeof window === "undefined") return "direct";
  const { utm_source, utm_medium } = getStoredUtmParams();

  if (utm_source) {
    const source = utm_source.toLowerCase();
    const medium = (utm_medium ?? "").toLowerCase();
    if (isAiAssistantUtmSource(source)) return "ai_assistant";
    if (medium.includes("cpc") || medium.includes("ppc") || medium.includes("paid")) {
      if (source.includes("google")) return "paid_search";
      // Also Meta's own short names, used when an ad link is tagged utm_source={{site_source_name}}: fb, ig, an (Audience Network), msg (Messenger).
      if (source.includes("facebook") || source.includes("instagram") || source.includes("meta") || /^(fb|ig|an|msg)$/.test(source)) return "paid_social";
      return "paid_search";
    }
    if (source.includes("facebook") || source.includes("instagram") || source.includes("meta")) return "organic_social";
    if (medium === "email" || medium === "e-mail" || medium === "newsletter") return "email"; // GA4 files these under Email too
    return "referral";
  }

  const referrer = document.referrer;
  if (!referrer) return "direct";
  try {
    const referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
    const currentHost = window.location.hostname.replace(/^www\./, "");
    if (referrerHost === currentHost) return "direct";
    if (isAiAssistantHost(referrerHost)) return "ai_assistant"; // before the Google check: gemini.google.com
    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(referrerHost)) return "organic_search";
    if (/facebook\.|instagram\.|linkedin\.|twitter\.|x\.com|tiktok\./.test(referrerHost)) return "organic_social";
    return "referral";
  } catch {
    return "direct";
  }
}

// Thin wrapper: no-ops quietly when GA hasn't loaded (no measurement ID
// configured, or the script hasn't finished loading yet) rather than
// throwing and breaking the calling feature (e.g. a lead submission).
// `metaEventId`: the id for the matching Meta Pixel event, when the caller already has one (a lead form sends the same id
// to /api/leads, so a server-side copy of the event can be matched to this one). Left out, the pixel helper makes its own.
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}, metaEventId?: string): void {
  if (typeof window === "undefined") return;
  if (isInternalBrowser()) return; // the owner's own browser is never counted
  try {
    sendGAEvent("event", name, params);
  } catch {
    // GA not loaded — ignore.
  }
  trackMetaEvent(name, params, metaEventId);
}

// The same actions, sent to the Meta Pixel as Meta's standard events so Facebook/Instagram ads can optimise for them
// (Lead, Contact, ViewContent, Search, AddToWishlist). Actions with no standard equivalent go as custom events.
// Every lead action on the site already goes through trackEvent above, so mapping the names here covers every button
// and form that fires them. No personal data: only the listing slug, the kind of page and the kind of lead.
// A listing page view (ViewContent with the price) is sent straight from ProjectViewTracker, not from here.
// No-ops when the pixel is not on the page (non-production, owner's browser, or switched off).
function trackMetaEvent(name: string, params: Record<string, string | number | boolean>, eventId?: string): void {
  const slug = typeof params.listing_id === "string" ? params.listing_id : "";
  const category = pageContentCategory();
  // Searches are for homes or for land, whatever page the search box is on.
  const searchCategory = params.wants_land === true || category === "land" ? "land" : "project";
  switch (name) {
    case "view_blog_post":
      trackMetaPixel("ViewContent", { content_name: String(params.blog_slug ?? ""), content_category: "article" });
      break;
    case "view_floor_plan":
      trackMetaPixel("ViewContent", { content_name: slug, content_category: category, floor_plan: String(params.floor_plan_name ?? "") });
      break;
    case "generate_lead":
      // A WhatsApp lead is a Lead too (owner, 2026-11-27), so one ad goal, "Leads", covers every enquiry. It is also sent
      // as Contact (click_whatsapp below, fired in the same place).
      trackMetaPixel("Lead", { lead_type: params.form_type === "brochure" ? "brochure" : params.form_type === "whatsapp" ? "whatsapp" : "form", content_name: slug, content_category: category }, eventId);
      break;
    case "click_whatsapp":
      trackMetaPixel("Contact", { method: "whatsapp", content_name: slug, content_category: category }, eventId);
      break;
    case "call_click":
      trackMetaPixel("Contact", { method: "call", content_name: slug, content_category: category }, eventId);
      break;
    case "click_email":
      trackMetaPixel("Contact", { method: "email", content_name: slug, content_category: category }, eventId);
      break;
    case "click_whatsapp_profile":
    case "click_phone_profile": {
      // Developer and construction company profile pages. The other directories are not lead types we charge for.
      const profileCategory = params.profile_type === "developer" ? "developer" : params.profile_type === "construction-company" ? "construction_company" : null;
      if (!profileCategory) break;
      trackMetaPixel("Contact", { method: name === "click_phone_profile" ? "call" : "whatsapp", content_name: String(params.profile_slug ?? ""), content_category: profileCategory }, eventId);
      break;
    }
    case "download_brochure":
      // The brochure request itself is the Lead (generate_lead, form_type "brochure"); this is the file actually opening.
      trackMetaCustom("DownloadBrochure", { content_name: slug, content_category: category });
      break;
    case "search": {
      const text = cleanSearchString(String(params.search_term ?? ""));
      if (text) trackMetaPixel("Search", { search_string: text, content_category: searchCategory });
      break;
    }
    case "filter_listings":
      trackMetaPixel("Search", { search_string: cleanSearchString(`${params.filter_group}: ${params.filter_value}`), content_category: searchCategory });
      break;
    case "save_listing":
      trackMetaPixel("AddToWishlist", { content_name: slug, content_category: category });
      break;
    case "follow_developer":
      trackMetaCustom("FollowDeveloper", { developer_slug: String(params.developer_slug ?? "") });
      break;
    default:
      break;
  }
}

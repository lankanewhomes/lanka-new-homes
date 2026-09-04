"use client";

import { sendGAEvent } from "@next/third-parties/google";

const UTM_SESSION_KEY = "lnh-utm-session";

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
    if (medium.includes("cpc") || medium.includes("ppc") || medium.includes("paid")) {
      if (source.includes("google")) return "paid_search";
      if (source.includes("facebook") || source.includes("instagram") || source.includes("meta")) return "paid_social";
      return "paid_search";
    }
    if (source.includes("facebook") || source.includes("instagram") || source.includes("meta")) return "organic_social";
    return "referral";
  }

  const referrer = document.referrer;
  if (!referrer) return "direct";
  try {
    const referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
    const currentHost = window.location.hostname.replace(/^www\./, "");
    if (referrerHost === currentHost) return "direct";
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
export function trackEvent(name: string, params: Record<string, string | number | boolean> = {}): void {
  if (typeof window === "undefined") return;
  try {
    sendGAEvent("event", name, params);
  } catch {
    // GA not loaded — ignore.
  }
}

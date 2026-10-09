// "Don't count my own visits." Traffic from the owner's own browser is excluded from analytics: page views, WhatsApp / phone
// clicks, brochure downloads, saves and inquiry analytics events, and Google Analytics.
//
// A browser counts as internal when ANY of these is true:
//   • it carries the opt-out cookie `lnh_internal=1` — set by opening the site once with ?no-track=1 on that computer
//     (undo with ?no-track=0). The cookie lasts about 10 years.
//   • it is logged in to the CMS (Payload's `payload-token` cookie is sent to every path on this domain).
//   • its IP address is listed in the INTERNAL_IPS environment variable (comma separated) — optional.
// The actual enquiry (the lead itself) is still saved and still alerts the developer; only the analytics event is skipped.

export const INTERNAL_COOKIE = "lnh_internal";

/** Server side: is this request from an internal browser? */
export function isInternalRequest(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  if (new RegExp(`(?:^|;\\s*)${INTERNAL_COOKIE}=1(?:;|$)`).test(cookie)) return true;
  if (/(?:^|;\s*)payload-token=/.test(cookie)) return true;
  const ips = (process.env.INTERNAL_IPS ?? "").split(",").map((ip) => ip.trim()).filter(Boolean);
  if (ips.length > 0) {
    const forwarded = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (forwarded && ips.includes(forwarded)) return true;
  }
  return false;
}

/** Browser side: has this browser been marked internal? */
export function isInternalBrowser(): boolean {
  if (typeof document === "undefined") return false;
  return new RegExp(`(?:^|;\\s*)${INTERNAL_COOKIE}=1(?:;|$)`).test(document.cookie);
}

/** Browser side: turn the opt-out on or off for this browser. */
export function setInternalBrowser(on: boolean): void {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${INTERNAL_COOKIE}=${on ? "1" : "0"}; Path=/; Max-Age=${on ? 315360000 : 0}; SameSite=Lax${secure}`;
}

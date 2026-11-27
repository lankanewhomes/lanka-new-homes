// Meta (Facebook/Instagram) Pixel events: the one place the site calls `fbq`. The pixel itself is loaded once, by
// DeferredMetaPixel (src/components/analytics/deferred-meta-pixel.tsx); nothing here loads it. See docs/analytics.md,
// "Meta Pixel events".
//
// - Every event carries an event id (a UUID) as { eventID }, so a Conversions API copy of the same event sent from the
//   server later is counted once. Where the action is also logged on our own server (WhatsApp tap, brochure, enquiry),
//   the caller creates the id first with createEventId(), sends it with that request, and passes the same id here.
// - No personal data: parameters are slugs, page types and fixed labels only. The one free-text value, search_string,
//   has email addresses and phone-like numbers masked before it leaves the browser.
// - Safe anywhere: does nothing on the server, when the pixel is blocked or not loaded (development, the owner's own
//   browser), and never throws into the button or form that called it. In development each event is logged to the console.

import { isInternalBrowser } from "@/lib/internal-traffic";

/** The kind of page or listing an event is about. */
export type MetaContentCategory = "project" | "land" | "developer" | "construction_company";

/** Parameters for each event. Standard Meta events go out with fbq("track"), the rest with fbq("trackCustom"). */
export type MetaEventParams = {
  PageView: Record<string, never>;
  ViewContent: { content_name: string; content_category: MetaContentCategory; value?: number; currency?: "LKR" };
  Contact: { method: "whatsapp" | "call"; content_name: string; content_category: MetaContentCategory };
  Lead: { lead_type: "brochure" | "form"; content_name: string; content_category: MetaContentCategory };
  Search: { search_string: string; content_category: MetaContentCategory };
  CompleteRegistration: { content_name: "user" | "developer" };
  AddToWishlist: { content_name: string; content_category?: MetaContentCategory };
  FollowDeveloper: { content_name: string; content_category: "developer" };
};

export type MetaEventName = keyof MetaEventParams;

const CUSTOM_EVENTS: ReadonlySet<MetaEventName> = new Set<MetaEventName>(["FollowDeveloper"]);

type Fbq = (command: "track" | "trackCustom", eventName: string, params: Record<string, unknown>, options: { eventID: string }) => void;

/** A new event id: a v4 UUID, also from older browsers and plain-http pages where crypto.randomUUID is missing. */
export function createEventId(): string {
  const cryptoApi = typeof globalThis.crypto === "object" ? globalThis.crypto : undefined;
  if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (typeof cryptoApi?.getRandomValues === "function") cryptoApi.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// Seven or more digits, allowing the spaces, dashes, dots, brackets and leading + people type in phone numbers
// ("077 123 4567", "+94-77-123-4567"). Prices written with thousands commas ("50,000,000") and "50M" are left alone.
const PHONE_PATTERN = /\+?\(?\d(?:[\s().-]*\d){6,}/g;

/** Masks email addresses and phone-like numbers in text a visitor typed (the search box). */
export function maskPersonalData(text: string): string {
  return text.replace(EMAIL_PATTERN, "[email]").replace(PHONE_PATTERN, "[number]");
}

/**
 * Sends one Meta Pixel event and returns its event id (the one given, or a new one).
 * Pass `eventId` when the same action is also logged on our server, so both carry the same id.
 */
export function trackEvent<E extends MetaEventName>(eventName: E, params: MetaEventParams[E], eventId: string = createEventId()): string {
  if (typeof window === "undefined") return eventId;
  const data: Record<string, unknown> = { ...(params as Record<string, unknown>) };
  if (typeof data.search_string === "string") data.search_string = maskPersonalData(data.search_string);

  const fbq = (window as Window & { fbq?: Fbq }).fbq;
  const willSend = typeof fbq === "function" && !isInternalBrowser();
  if (process.env.NODE_ENV === "development") {
    console.info(`[Meta Pixel] ${eventName}${willSend ? "" : " (not sent: pixel not loaded)"}`, data, { eventID: eventId });
  }
  if (!willSend) return eventId;
  try {
    fbq(CUSTOM_EVENTS.has(eventName) ? "trackCustom" : "track", eventName, data, { eventID: eventId });
  } catch {
    // Pixel blocked or half-loaded: the action that called this must still work.
  }
  return eventId;
}

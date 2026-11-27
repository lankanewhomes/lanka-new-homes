// Meta (Facebook / Instagram) Pixel events. The pixel itself is loaded once, in
// src/components/analytics/deferred-meta-pixel.tsx; this file only sends events to it.
//
// Every event carries its own event id ({ eventID }), so the same event sent later from the server through the
// Conversions API with the same id is counted once by Meta, not twice.
//
// Never put personal data (name, email, phone) in the parameters. The types below only allow listing, page and
// lead-type fields, and search text is cleaned of emails and phone numbers before it is sent.

/** The kind of page the event happened on. */
export type MetaContentCategory = "project" | "land" | "developer" | "construction_company";

export type MetaEventParams = {
  PageView: Record<string, never>;
  ViewContent: {
    content_name: string;
    content_category: MetaContentCategory | "article";
    /** Starting price in rupees (project pages with a published price). */
    value?: number;
    currency?: "LKR";
    /** Floor plan or plot name, on a floor plan / plot page. */
    floor_plan?: string;
  };
  Contact: { method: "whatsapp" | "call" | "email"; content_name: string; content_category: MetaContentCategory };
  Lead: { lead_type: "brochure" | "form"; content_name: string; content_category: MetaContentCategory };
  Search: { search_string: string; content_category: MetaContentCategory };
  CompleteRegistration: { content_name: "user" | "developer" };
  AddToWishlist: { content_name: string; content_category: MetaContentCategory };
};

export type MetaEventName = keyof MetaEventParams;

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as unknown as { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

/** A new id for one event (a UUID). Send the same id with the server-side copy of the event. */
export function newMetaEventId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // fall through to the manual version below
  }
  // crypto.randomUUID needs a secure page and a recent browser; this covers the rest.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function send(kind: "track" | "trackCustom", eventName: string, params: Record<string, unknown>, eventId?: string): string {
  const id = eventId || newMetaEventId();
  if (typeof window === "undefined") return id;
  if (process.env.NODE_ENV === "development") console.debug(`[meta-pixel] ${eventName}`, params, { eventID: id });
  // No pixel on the page (not production, the owner's own browser, switched off) or blocked: nothing to do.
  const fbq = getFbq();
  if (!fbq) return id;
  try {
    fbq(kind, eventName, params, { eventID: id });
  } catch {
    // Pixel blocked or broken: never let tracking break the page.
  }
  return id;
}

/**
 * Sends one of Meta's standard events. Safe anywhere: does nothing on the server or when the pixel is not on the page.
 * Returns the event id that was used (the one passed in, or a new one).
 */
export function trackEvent<E extends MetaEventName>(eventName: E, params?: MetaEventParams[E], eventId?: string): string {
  return send("track", eventName, { ...(params ?? {}) }, eventId);
}

/** Sends an event that is not one of Meta's standard ones (for example DownloadBrochure). Same rules: no personal data. */
export function trackCustomEvent(eventName: string, params: Record<string, string | number | boolean> = {}, eventId?: string): string {
  return send("trackCustom", eventName, params, eventId);
}

/** The content_category for the page the visitor is on. */
export function pageContentCategory(pathname?: string): MetaContentCategory {
  const path = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  if (path.startsWith("/land")) return "land";
  if (path.startsWith("/developers/")) return "developer";
  if (path.startsWith("/construction-companies/")) return "construction_company";
  return "project";
}

/** Search text with anything that looks like an email address or a phone number taken out. */
export function cleanSearchString(text: string): string {
  return text
    .replace(/\S+@\S+\.\S+/g, "")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);
}

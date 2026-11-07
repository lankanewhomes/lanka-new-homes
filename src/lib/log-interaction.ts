"use client";

import { getStoredUtmParams, getTrafficSource } from "@/lib/ga4";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { getSessionId } from "@/components/marketplace/view-tracker";

export type ListingInteraction = "map_pin_click" | "compare_add" | "compare_remove" | "form_field_focus" | "save" | "floor_plan_view";

/** Saves a visitor action on a project or land listing in the backend analytics list (the owner's own browser is never counted). `detail` is the form field name for form_field_focus. */
export function logListingInteraction(eventType: ListingInteraction, projectSlug: string, detail?: string) {
  if (isInternalBrowser()) return;
  fetch("/api/events/interaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, projectSlug, detail, sessionId: getSessionId(), trafficSource: getTrafficSource(), utm: getStoredUtmParams() }),
    keepalive: true,
  }).catch(() => {});
}

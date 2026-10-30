"use client";

import { useEffect } from "react";
import { captureUtmParams, getStoredUtmParams, getTrafficSource, trackEvent } from "@/lib/ga4";
import { isInternalBrowser } from "@/lib/internal-traffic";

export const SESSION_KEY = "newhomessrilanka-session-id";

export function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function ProjectViewTracker({
  projectSlug,
  projectName,
  developerSlug,
}: {
  projectSlug: string;
  projectName: string;
  developerSlug: string;
}) {
  useEffect(() => {
    if (isInternalBrowser()) return; // the owner's own visits are never counted
    const sessionId = getSessionId();
    captureUtmParams(); // first touch of the session: make sure the landing link's utm_* are stored before this view is sent

    fetch("/api/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, developerSlug, sessionId, trafficSource: getTrafficSource(), utm: getStoredUtmParams() }),
    }).catch(() => {
      // No-op for UI mode.
    });

    // listing_id is passed as a custom event parameter (not GA4's built-in
    // item_id) so it can be filtered on directly in GA4/Looker Studio — see
    // docs/analytics.md for the GA4-side custom dimension setup this needs.
    trackEvent("view_listing", { listing_id: projectSlug, listing_name: projectName, ...(developerSlug ? { developer_slug: developerSlug } : {}) });
  }, [projectSlug, projectName, developerSlug]);

  return null;
}

/** A floor plan page was opened: a strong buying signal on apartment projects. */
export function FloorPlanViewTracker({ projectSlug, floorPlanId, floorPlanName, developerSlug }: { projectSlug: string; floorPlanId: string; floorPlanName: string; developerSlug: string }) {
  useEffect(() => {
    trackEvent("view_floor_plan", { listing_id: projectSlug, floor_plan_id: floorPlanId, floor_plan_name: floorPlanName, ...(developerSlug ? { developer_slug: developerSlug } : {}) });
  }, [projectSlug, floorPlanId, floorPlanName, developerSlug]);
  return null;
}

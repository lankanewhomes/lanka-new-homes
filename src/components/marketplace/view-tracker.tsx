"use client";

import { useEffect } from "react";
import { captureUtmParams, getStoredUtmParams, getTrafficSource, trackEvent } from "@/lib/ga4";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { shouldSendBrowserView } from "@/lib/analytics-compare";
import { logListingInteraction } from "@/lib/log-interaction";

export const SESSION_KEY = "newhomessrilanka-session-id";
const BROWSER_VIEW_KEY = "lnh-view-sent:";

/** Google / Meta get a listing view once per 30 minutes per browser, the same rule our own count uses, so the numbers line up. */
function claimBrowserView(projectSlug: string): boolean {
  try {
    const key = BROWSER_VIEW_KEY + projectSlug;
    const raw = localStorage.getItem(key);
    const now = Date.now();
    if (!shouldSendBrowserView(raw ? Number(raw) : null, now)) return false;
    localStorage.setItem(key, String(now));
    return true;
  } catch {
    return true; // storage blocked: send it, as before
  }
}

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
  kind = "project",
}: {
  projectSlug: string;
  projectName: string;
  developerSlug: string;
  /** "land" for a land plot page: logged in the analytics list only (the project_views table is projects-only). */
  kind?: "project" | "land";
}) {
  useEffect(() => {
    if (isInternalBrowser()) return; // the owner's own visits are never counted
    const sessionId = getSessionId();
    captureUtmParams(); // first touch of the session: make sure the landing link's utm_* are stored before this view is sent

    fetch("/api/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, developerSlug, kind, sessionId, trafficSource: getTrafficSource(), utm: getStoredUtmParams() }),
    }).catch(() => {
      // No-op for UI mode.
    });

    // listing_id is passed as a custom event parameter (not GA4's built-in
    // item_id) so it can be filtered on directly in GA4/Looker Studio — see
    // docs/analytics.md for the GA4-side custom dimension setup this needs.
    if (!claimBrowserView(projectSlug)) return;
    trackEvent("view_listing", { listing_id: projectSlug, listing_name: projectName, ...(developerSlug ? { developer_slug: developerSlug } : {}) });
  }, [projectSlug, projectName, developerSlug, kind]);

  return null;
}

/** A floor plan page was opened: a strong buying signal on apartment projects. */
export function FloorPlanViewTracker({ projectSlug, floorPlanId, floorPlanName, developerSlug }: { projectSlug: string; floorPlanId: string; floorPlanName: string; developerSlug: string }) {
  useEffect(() => {
    logListingInteraction("floor_plan_view", projectSlug, floorPlanName);
    trackEvent("view_floor_plan", { listing_id: projectSlug, floor_plan_id: floorPlanId, floor_plan_name: floorPlanName, ...(developerSlug ? { developer_slug: developerSlug } : {}) });
  }, [projectSlug, floorPlanId, floorPlanName, developerSlug]);
  return null;
}

"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/ga4";

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
    const sessionId = getSessionId();

    fetch("/api/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, developerSlug, sessionId }),
    }).catch(() => {
      // No-op for UI mode.
    });

    // listing_id is passed as a custom event parameter (not GA4's built-in
    // item_id) so it can be filtered on directly in GA4/Looker Studio — see
    // docs/analytics.md for the GA4-side custom dimension setup this needs.
    trackEvent("view_listing", { listing_id: projectSlug, listing_name: projectName });
  }, [projectSlug, projectName, developerSlug]);

  return null;
}

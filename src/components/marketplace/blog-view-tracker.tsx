"use client";

import { useEffect } from "react";
import { captureUtmParams, getStoredUtmParams, getTrafficSource, trackEvent } from "@/lib/ga4";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { getSessionId } from "@/components/marketplace/view-tracker";

/** A blog article was opened: saved in the backend analytics list and sent to Google Analytics as view_blog_post. */
export function BlogViewTracker({ blogSlug, title }: { blogSlug: string; title: string }) {
  useEffect(() => {
    if (isInternalBrowser()) return; // the owner's own visits are never counted
    captureUtmParams();
    fetch("/api/events/blog-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blogSlug, sessionId: getSessionId(), trafficSource: getTrafficSource(), utm: getStoredUtmParams() }),
      keepalive: true,
    }).catch(() => {});
    trackEvent("view_blog_post", { blog_slug: blogSlug, blog_title: title, traffic_source: getTrafficSource() });
  }, [blogSlug, title]);
  return null;
}

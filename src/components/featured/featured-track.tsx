"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { trackEvent } from "@/lib/ga4";

// Measures a Featured placement: one featured_impression when at least half of it has been on screen, one featured_click per click on a link
// inside it. Both go to GA4 (placement, project_slug, developer) and, outside the demo, to our own table for the monthly developer report.
// The click is remembered for this visit so a lead that follows can be credited to the placement (see recordFeaturedLead in lib/featured/client-tracking.ts).
export type TrackProps = { placement: string; projectSlug?: string; developer?: string; demo?: boolean };

export const FEATURED_REF_KEY = "lnh-featured-ref";

function beacon(event: "impression" | "click" | "lead", props: TrackProps) {
  if (props.demo) return; // the demo never writes anywhere
  try {
    const body = JSON.stringify({ event, placement: props.placement, projectSlug: props.projectSlug, developer: props.developer, path: window.location.pathname });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/featured/track", new Blob([body], { type: "application/json" }));
    else void fetch("/api/featured/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    // tracking must never break the page
  }
}

/** GA4 + report beacon for one Featured event (used by the tracker below and by the hero slider, which is not a FeaturedTrack). */
export function trackFeatured(kind: "impression" | "click", props: TrackProps) {
  trackEvent(`featured_${kind}`, { placement: props.placement, project_slug: props.projectSlug ?? "", developer: props.developer ?? "" });
  beacon(kind, props);
  if (kind === "click") {
    try {
      sessionStorage.setItem(FEATURED_REF_KEY, JSON.stringify({ placement: props.placement, projectSlug: props.projectSlug, developer: props.developer }));
    } catch {
      // storage unavailable
    }
  }
}

export function recordFeaturedLead(demo = false) {
  try {
    const raw = sessionStorage.getItem(FEATURED_REF_KEY);
    if (!raw) return;
    const ref = JSON.parse(raw) as TrackProps;
    trackEvent("featured_lead", { placement: ref.placement, project_slug: ref.projectSlug ?? "", developer: ref.developer ?? "" });
    beacon("lead", { ...ref, demo });
  } catch {
    // ignore
  }
}

export function FeaturedTrack({ placement, projectSlug, developer, demo, className, children, as: Tag = "div" }: TrackProps & { className?: string; children: ReactNode; as?: "div" | "li" | "section" | "aside" | "article" }) {
  const ref = useRef<HTMLElement | null>(null);
  const sent = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (sent.current || !entries.some((entry) => entry.isIntersecting)) return;
        sent.current = true;
        trackFeatured("impression", { placement, projectSlug, developer, demo });
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [placement, projectSlug, developer, demo]);

  const onClickCapture = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const link = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!link) return;
    trackFeatured("click", { placement, projectSlug, developer, demo });
  };

  const Element = Tag as "div";
  return (
    <Element ref={ref as React.RefObject<HTMLDivElement>} className={className} onClickCapture={onClickCapture} data-featured-placement={placement}>
      {children}
    </Element>
  );
}

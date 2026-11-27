"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { trackEvent } from "@/lib/metaPixel";
import { takeNewSignupCookie } from "@/lib/meta-pixel-signup";

// Meta (Facebook/Instagram) Pixel, for ad measurement and retargeting. Loaded like Clarity (deferred-clarity.tsx): once the
// page has been interacted with, or after 4 s, so it never competes with the first paint. Skipped for the owner's own
// browser (?internal=1) and outside production. The pixel id is public by design (it is in the page source of any site using it).
// This is Meta's standard snippet, so the stub is defined before fbevents.js loads and nothing queued is lost.
// Events are sent through src/lib/metaPixel.ts (see docs/analytics.md, "Meta Pixel events").
//
// Page views: one PageView with init, then one per App Router navigation (RoutePageViews below). Meta's own PageView on
// browser-history changes is switched off (fbq.disablePushState) so a navigation is never counted twice, and ours is queued
// even when the visitor moves on before fbevents.js has arrived.
export function DeferredMetaPixel({ pixelId }: { pixelId?: string }) {
  useEffect(() => {
    if (!pixelId || process.env.NODE_ENV !== "production") return;
    try {
      if (isInternalBrowser() || window.localStorage.getItem("ga_internal") === "1") return;
    } catch {
      // storage blocked: fall through, the cookie check above already ran
    }
    // Meta's stub is defined straight away and only the network script waits: events fired before fbevents.js arrives
    // (a listing view fires on page load) are queued and replayed in order, not lost. init + PageView go first.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const w = window as any;
    if (!w.fbq) {
      const fbq: any = (...args: unknown[]) => (fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args));
      w.fbq = fbq;
      if (!w._fbq) w._fbq = fbq;
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      fbq.queue = [];
      fbq.disablePushState = true; // navigations are sent by RoutePageViews instead
      fbq("init", pixelId);
      trackEvent("PageView", {});
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    let done = false;
    const load = () => {
      if (done) return;
      done = true;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, load, { once: true, passive: true }));
    const timer = window.setTimeout(load, 4000);
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, load));
    };
  }, [pixelId]);

  // A Google sign-up finishes in /auth/callback, which can't run the pixel: it leaves a one-time cookie for this page.
  useEffect(() => {
    const signup = takeNewSignupCookie();
    if (signup) trackEvent("CompleteRegistration", { content_name: signup });
  }, []);

  // useSearchParams needs a Suspense boundary on prerendered pages; this part renders nothing either way.
  return (
    <Suspense fallback={null}>
      <RoutePageViews />
    </Suspense>
  );
}

/** One PageView per App Router navigation to a new path or query string. The first page's PageView goes out with init. */
function RoutePageViews() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const url = search ? `${pathname}?${search}` : pathname;
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    if (lastUrl.current !== null && lastUrl.current !== url) trackEvent("PageView", {});
    lastUrl.current = url;
  }, [url]);

  return null;
}

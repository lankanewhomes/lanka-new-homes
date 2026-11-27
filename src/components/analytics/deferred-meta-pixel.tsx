"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isInternalBrowser } from "@/lib/internal-traffic";
import { newMetaEventId, trackEvent } from "@/lib/metaPixel";

// Meta (Facebook/Instagram) Pixel, for ad measurement and retargeting. Loaded like Clarity (deferred-clarity.tsx): once the
// page has been interacted with, or after 4 s, so it never competes with the first paint. Skipped for the owner's own
// browser (?internal=1) and outside production. The pixel id is public by design (it is in the page source of any site using it).
// This is Meta's standard snippet, unchanged, so the stub is defined before fbevents.js loads and nothing queued is lost.
//
// Page views: the first one is sent with init below. Moving between pages inside the site does not reload the page, so each
// later page gets its own PageView from the pathname effect. Meta's script would otherwise send one by itself on every
// history change (also when only a filter in the address changes), so that is switched off (disablePushState) and ours,
// which carries an event id, is the only one. Other events (ViewContent, Lead, Contact...) go through src/lib/metaPixel.ts.
export function DeferredMetaPixel({ pixelId }: { pixelId?: string }) {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const previous = lastPath.current;
    lastPath.current = pathname;
    if (previous === null || previous === pathname) return; // first page: init sends it
    trackEvent("PageView"); // does nothing when the pixel is not on the page
  }, [pathname]);

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
      fbq.disablePushState = true; // we send PageView on page changes ourselves, see above
      fbq("init", pixelId);
      fbq("track", "PageView", {}, { eventID: newMetaEventId() });
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

  return null;
}

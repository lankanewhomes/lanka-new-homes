"use client";

import { useEffect } from "react";
import { isInternalBrowser } from "@/lib/internal-traffic";

// Meta (Facebook/Instagram) Pixel, for ad measurement and retargeting. Loaded like Clarity (deferred-clarity.tsx): once the
// page has been interacted with, or after 4 s, so it never competes with the first paint. Skipped for the owner's own
// browser (?internal=1) and outside production. The pixel id is public by design (it is in the page source of any site using it).
// This is Meta's standard snippet, unchanged, so the stub is defined before fbevents.js loads and nothing queued is lost.
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
      fbq("init", pixelId);
      fbq("track", "PageView");
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

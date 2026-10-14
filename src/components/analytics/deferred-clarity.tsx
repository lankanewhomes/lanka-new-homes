"use client";

import { useEffect } from "react";
import { isInternalBrowser } from "@/lib/internal-traffic";

// Microsoft Clarity (heatmaps and session replays). Loaded like Google's tags (deferred-google-tags.tsx): once the page
// has been interacted with, or after 4 s, so it never competes with the first paint. Skipped for the owner's own browser
// (?internal=1, see internal-traffic-flag.tsx) and outside production, so our own visits and local testing do not pollute
// the recordings. The project id is public by design (it is in the page source of any Clarity site).
export function DeferredClarity({ projectId }: { projectId?: string }) {
  useEffect(() => {
    if (!projectId || process.env.NODE_ENV !== "production") return;
    let done = false;
    const start = async () => {
      if (done) return;
      done = true;
      try {
        if (isInternalBrowser() || window.localStorage.getItem("ga_internal") === "1") return;
      } catch {
        // storage blocked: fall through, the cookie check above already ran
      }
      const { default: Clarity } = await import("@microsoft/clarity");
      Clarity.init(projectId);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }));
    const timer = window.setTimeout(start, 4000);
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, start));
    };
  }, [projectId]);

  return null;
}

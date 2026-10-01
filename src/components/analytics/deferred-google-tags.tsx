"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

// GA4 + GTM are ~200 KiB of third-party script that competed with the hero image on first load (PageSpeed,
// 2026-10-01: mobile 68, LCP 6.1 s). Load them once the page has finished loading and the browser is idle —
// or on the first interaction, whichever comes first. dataLayer is created straight away so events fired
// before the tags arrive are queued and replayed, not lost.
export function DeferredGoogleTags({ gaId, gtmId }: { gaId?: string; gtmId?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const w = window as unknown as { dataLayer?: unknown[] };
    w.dataLayer = w.dataLayer || [];
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    const timer = window.setTimeout(go, 4000);
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, go));
    };
  }, []);

  if (!ready) return null;
  return (
    <>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
    </>
  );
}

"use client";

import { useEffect } from "react";
import { isInternalBrowser, setInternalBrowser } from "@/lib/internal-traffic";

// Mounted once in the root layout. Opening the site with ?internal=1 (or ?no-track=1) marks this browser as the owner's:
//   • the opt-out cookie stops our own analytics events (views, clicks, leads' analytics) from being counted, and
//   • localStorage.ga_internal = "1" is kept as the flag for Google Analytics.
// ?internal=0 (or ?no-track=0) undoes both. For an internal browser every Google Analytics hit is sent with
// traffic_type = "internal", which GA's active "Internal Traffic" data filter excludes from reports. The 'set' command goes
// onto dataLayer before GA loads (GA is deferred, see deferred-google-tags.tsx), so it is applied to the first hit.
export function InternalTrafficFlag({ gaId }: { gaId?: string }) {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const param = query.get("internal") ?? query.get("no-track");
    if (param === "1") setInternalBrowser(true);
    if (param === "0") setInternalBrowser(false);
    let flagged = false;
    try {
      if (param === "1") window.localStorage.setItem("ga_internal", "1");
      if (param === "0") window.localStorage.removeItem("ga_internal");
      flagged = window.localStorage.getItem("ga_internal") === "1";
    } catch {
      // storage blocked: the cookie flag below still works
    }
    if (flagged || isInternalBrowser()) {
      const w = window as unknown as { dataLayer?: unknown[] };
      w.dataLayer = w.dataLayer || [];
      // gtag() pushes the `arguments` object, not an array — that is the form GA's loader replays.
      const gtag = function () { w.dataLayer!.push(arguments); }; // eslint-disable-line prefer-rest-params
      (gtag as (...args: unknown[]) => void)("set", { traffic_type: "internal" });
    }
  }, [gaId]);

  return null;
}

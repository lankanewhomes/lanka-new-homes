"use client";

import { useEffect } from "react";
import { isInternalBrowser, setInternalBrowser } from "@/lib/internal-traffic";

// Mounted once in the root layout. Opening the site with ?no-track=1 marks this browser as the owner's (not counted in
// analytics); ?no-track=0 undoes it. Also tells Google Analytics to stand down for an internal browser.
export function InternalTrafficFlag({ gaId }: { gaId?: string }) {
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("no-track");
    if (param === "1") setInternalBrowser(true);
    if (param === "0") setInternalBrowser(false);
    if (gaId && isInternalBrowser()) {
      (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true;
    }
  }, [gaId]);

  return null;
}

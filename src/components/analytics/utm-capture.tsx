"use client";

import { useEffect } from "react";
import { captureUtmParams } from "@/lib/ga4";

// Mounted once in the root layout — captures utm_source/medium/campaign
// from the landing URL into sessionStorage before any client-side
// navigation can drop them from the address bar. Must run before the
// generate_lead/view_listing events that read this back (see ga4.ts).
export function UtmCapture() {
  useEffect(() => {
    captureUtmParams();
  }, []);

  return null;
}

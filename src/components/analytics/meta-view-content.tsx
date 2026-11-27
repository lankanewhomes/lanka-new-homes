"use client";

import { useEffect } from "react";
import { trackEvent, type MetaContentCategory } from "@/lib/metaPixel";

// React runs effects twice in development: the second run within a second, for the same page, is not a new view.
let lastSent: { key: string; at: number } | null = null;

/**
 * Meta Pixel ViewContent for a listing or profile page: once per page view, on the first load and on every App Router
 * navigation to the page. Placed in the page itself (not in the shared listing components) so the listing preview page
 * sends nothing.
 */
export function MetaViewContent({ contentName, contentCategory, value }: { contentName: string; contentCategory: MetaContentCategory; value?: number }) {
  useEffect(() => {
    const key = `${contentCategory}:${contentName}`;
    const now = Date.now();
    if (lastSent && lastSent.key === key && now - lastSent.at < 1000) return;
    lastSent = { key, at: now };
    trackEvent("ViewContent", {
      content_name: contentName,
      content_category: contentCategory,
      // "Contact for pricing" listings have no price: no value rather than a value of 0.
      ...(typeof value === "number" && value > 0 ? { value, currency: "LKR" as const } : {}),
    });
  }, [contentName, contentCategory, value]);

  return null;
}

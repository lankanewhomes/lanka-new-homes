"use client";

import { useCallback, useEffect, useState } from "react";
import { MAX_COMPARE } from "@/lib/compare-constants";

// Compare is a session convenience, not an account feature like Saved
// listings (which persists server-side per logged-in user via Supabase) —
// no login required, just localStorage, so a browsing visitor can compare
// a few projects without creating an account first. Wrapped in try/catch
// throughout: private browsing / blocked storage should degrade to "compare
// just doesn't persist," never throw.
// `name` is the listing's display name for the compare bar's chips; entries saved
// before it existed only have a slug, so readers fall back to compareEntryLabel().
export type CompareEntry = { slug: string; type: "project" | "land"; name?: string };

/** "rudra-wellness-retreat-kalkudah" → "Rudra Wellness Retreat Kalkudah" (fallback when no name was stored). */
export function compareEntryLabel(entry: CompareEntry): string {
  if (entry.name) return entry.name;
  return entry.slug.split("-").filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

const STORAGE_KEY = "lnh-compare";
// Re-exported so existing client-side importers (listing-page.tsx,
// compare-bar.tsx) don't need to change — compare/page.tsx (a Server
// Component) must import it from compare-constants.ts directly instead;
// see that file's comment for why.
export { MAX_COMPARE };

function readStorage(): CompareEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed
          .filter((e) => e && typeof e.slug === "string" && (e.type === "project" || e.type === "land"))
          .map((e) => ({ slug: e.slug, type: e.type, ...(typeof e.name === "string" && e.name ? { name: e.name } : {}) }))
      : [];
  } catch {
    return [];
  }
}

function writeStorage(entries: CompareEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    // Same-tab listeners (CompareBar, a card's own toggle state elsewhere on
    // the page) don't see the native "storage" event, which only fires in
    // OTHER tabs — dispatch our own so every mounted useCompareListings()
    // instance on this page updates immediately.
    window.dispatchEvent(new Event("lnh-compare-change"));
  } catch {
    // Storage unavailable — compare just won't persist this session.
  }
}

export function useCompareListings() {
  const [entries, setEntries] = useState<CompareEntry[]>([]);

  useEffect(() => {
    // localStorage isn't available during SSR — reading it here (once, on
    // mount) rather than in useState's initializer is the standard
    // hydration-safe pattern this codebase already uses elsewhere.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(readStorage());
    const onChange = () => setEntries(readStorage());
    window.addEventListener("lnh-compare-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("lnh-compare-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const isComparing = useCallback((slug: string) => entries.some((e) => e.slug === slug), [entries]);

  const toggle = useCallback((slug: string, type: CompareEntry["type"], name?: string) => {
    const current = readStorage();
    if (current.some((e) => e.slug === slug)) {
      writeStorage(current.filter((e) => e.slug !== slug));
      return;
    }
    if (current.length >= MAX_COMPARE) return; // caller decides how to surface the cap
    writeStorage([...current, { slug, type, ...(name ? { name } : {}) }]);
  }, []);

  const clear = useCallback(() => writeStorage([]), []);
  const remove = useCallback((slug: string) => writeStorage(readStorage().filter((e) => e.slug !== slug)), []);

  return { entries, isComparing, toggle, clear, remove, atMax: entries.length >= MAX_COMPARE };
}

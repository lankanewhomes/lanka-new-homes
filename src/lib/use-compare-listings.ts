"use client";

import { useCallback, useEffect, useState } from "react";

// Compare is a session convenience, not an account feature like Saved
// listings (which persists server-side per logged-in user via Supabase) —
// no login required, just localStorage, so a browsing visitor can compare
// a few projects without creating an account first. Wrapped in try/catch
// throughout: private browsing / blocked storage should degrade to "compare
// just doesn't persist," never throw.
export type CompareEntry = { slug: string; type: "project" | "land" };

const STORAGE_KEY = "lnh-compare";
export const MAX_COMPARE = 4;

function readStorage(): CompareEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.slug === "string" && (e.type === "project" || e.type === "land")) : [];
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

  const toggle = useCallback((slug: string, type: CompareEntry["type"]) => {
    const current = readStorage();
    if (current.some((e) => e.slug === slug)) {
      writeStorage(current.filter((e) => e.slug !== slug));
      return;
    }
    if (current.length >= MAX_COMPARE) return; // caller decides how to surface the cap
    writeStorage([...current, { slug, type }]);
  }, []);

  const clear = useCallback(() => writeStorage([]), []);
  const remove = useCallback((slug: string) => writeStorage(readStorage().filter((e) => e.slug !== slug)), []);

  return { entries, isComparing, toggle, clear, remove, atMax: entries.length >= MAX_COMPARE };
}

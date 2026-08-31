"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "newhomessrilanka-compare";
const UPDATE_EVENT = "newhomessrilanka-compare-updated";
const MAX_ENTRIES = 4;

export type CompareEntry = { slug: string; basePath: string };

function readEntries(): CompareEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// localStorage writes only fire the native `storage` event in *other* tabs,
// never the tab that made the change — this app has multiple independent
// useCompare() instances mounted at once on the same page (the rail badge,
// the Compare panel, every card's toggle button), so a custom same-tab event
// is what actually keeps them all in sync with each other.
function writeEntries(entries: CompareEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useCompare() {
  const [entries, setEntries] = useState<CompareEntry[]>([]);

  useEffect(() => {
    setEntries(readEntries());
    const sync = () => setEntries(readEntries());
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isComparing = useCallback((slug: string) => entries.some((entry) => entry.slug === slug), [entries]);

  const toggle = useCallback((slug: string, basePath: string) => {
    const prev = readEntries();
    const next = prev.some((entry) => entry.slug === slug)
      ? prev.filter((entry) => entry.slug !== slug)
      : prev.length >= MAX_ENTRIES
        ? prev
        : [...prev, { slug, basePath }];
    if (next !== prev) writeEntries(next);
  }, []);

  const remove = useCallback((slug: string) => {
    writeEntries(readEntries().filter((entry) => entry.slug !== slug));
  }, []);

  const clear = useCallback(() => {
    writeEntries([]);
  }, []);

  return { entries, isComparing, toggle, remove, clear, count: entries.length, max: MAX_ENTRIES };
}

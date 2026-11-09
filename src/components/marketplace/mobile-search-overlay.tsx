"use client";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, X } from "lucide-react";
import { parseNaturalSearch } from "@/lib/natural-search";
import { trackEvent } from "@/lib/ga4";
import { SEARCH_QUICK_CHIPS, type QuickChip } from "@/lib/search-chips";

/** Quick links under the Search button and in the desktop search dropdowns (owner, 2026-11-09). Starts with the fixed list, then switches to the
 *  live order from /api/search/chips: the chips with the most listings first, empty ones hidden. */
let chipsRequest: Promise<QuickChip[]> | null = null;
function loadLiveChips(): Promise<QuickChip[]> {
  chipsRequest ??= fetch("/api/search/chips")
    .then((response) => response.json())
    .then((data) => (Array.isArray(data?.chips) && data.chips.length > 0 ? (data.chips as QuickChip[]) : SEARCH_QUICK_CHIPS))
    .catch(() => SEARCH_QUICK_CHIPS);
  return chipsRequest;
}

/** Rows that fill the width: each chip goes into the first row that still has room for it (measured with the real font), so the chips with the
 *  most listings stay near the top and shorter chips fill the gaps on the right instead of starting new rows (owner, 2026-11-09). */
function packRows(chips: QuickChip[], widthOf: (chip: QuickChip) => number, available: number, gap: number): QuickChip[][] {
  const rows: { chips: QuickChip[]; used: number }[] = [];
  for (const chip of chips) {
    const w = widthOf(chip);
    const row = rows.find((r) => r.used + gap + w <= available);
    if (row) { row.chips.push(chip); row.used += gap + w; } else rows.push({ chips: [chip], used: w });
  }
  return rows.map((r) => r.chips);
}

export function SearchQuickChips({ onPick }: { onPick: () => void }) {
  const [chips, setChips] = useState<QuickChip[]>(SEARCH_QUICK_CHIPS);
  const [rows, setRows] = useState<QuickChip[][] | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    loadLiveChips().then((live) => { if (alive) { setChips(live); setRows(null); } });
    return () => { alive = false; };
  }, []);
  useLayoutEffect(() => {
    const el = box.current;
    const sample = el?.querySelector("a");
    if (!el || !sample || rows) return;
    const available = el.clientWidth;
    const context = document.createElement("canvas").getContext("2d");
    if (!available || !context) return;
    const style = getComputedStyle(sample);
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    const gap = parseFloat(getComputedStyle(el).columnGap) || 8;
    setRows(packRows(chips, (chip) => Math.ceil(context.measureText(chip.label).width + padding) + 2, available, gap));
  }, [chips, rows]);
  return (
    <div className="mobile-location-search-chips" aria-label="Popular searches" ref={box}>
      {rows
        ? rows.map((row, index) => (
            <div className="mobile-location-search-chips-row" key={index}>
              {row.map((chip) => <Link key={chip.label} href={chip.href} onClick={onPick}>{chip.label}</Link>)}
            </div>
          ))
        : chips.map((chip) => <Link key={chip.label} href={chip.href} onClick={onPick}>{chip.label}</Link>)}
    </div>
  );
}

// The phone search pop-up from the home page hero ("Location search": scrim, panel, input, suggestions, All of Sri Lanka, Search),
// available from the header search icon on every page (owner, 2026-11-09: "make the nav search the same as the hero search"). Same
// classes (.mobile-location-search*, phones only) and the same submit rule as the hero: land phrases go to /land, everything else to
// /search?q=, an empty search opens /search.
export function MobileSearchOverlay({ open, onClose, location }: { open: boolean; onClose: () => void; location: string }) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [suggestions, setSuggestions] = useState<{ label: string; detail: string; href: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    const q = term.trim();
    if (q.length < 2) {
      const clear = setTimeout(() => setSuggestions([]), 0);
      return () => clearTimeout(clear);
    }
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`)
        .then((response) => response.json())
        .then((data) => setSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []))
        .catch(() => setSuggestions([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [term, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = term.trim();
    const wantsLand = query ? parseNaturalSearch(query).land === true : false;
    if (query) trackEvent("search", { search_term: query.slice(0, 100), search_location: location, wants_land: wantsLand });
    router.push(query ? `${wantsLand ? "/land" : "/search"}?q=${encodeURIComponent(query)}` : "/search");
    onClose();
  };

  return (
    <div className="mobile-location-search" role="dialog" aria-modal="true" aria-label="Location search">
      <button type="button" className="mobile-location-search-scrim" aria-label="Close location search" onClick={onClose} />
      <div className="mobile-location-search-panel">
        <div className="mobile-location-search-header">
          <p>Find your home</p>
          <button type="button" aria-label="Close location search" onClick={onClose}><X size={22} /></button>
        </div>
        <form className="mobile-location-search-form" onSubmit={submit}>
          <label className="mobile-location-search-input">
            <Search size={20} aria-hidden="true" />
            <input autoFocus aria-label="Search location" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Enter a location, address, or project" />
          </label>
          {suggestions.length > 0 ? (
            <div className="mobile-location-search-suggestions" role="listbox" aria-label="Search suggestions">
              {suggestions.map((suggestion) => (
                <button key={`${suggestion.detail}-${suggestion.label}`} type="button" role="option" aria-selected={false} onClick={() => { setTerm(suggestion.label); onClose(); router.push(suggestion.href); }}>
                  <Search size={16} aria-hidden="true" /><span>{suggestion.label}</span><small>{suggestion.detail}</small>
                </button>
              ))}
            </div>
          ) : null}
          <button type="button" className="mobile-location-search-region"><span>All of Sri Lanka</span><ChevronDown size={18} aria-hidden="true" /></button>
          <button type="submit" className="mobile-location-search-submit"><Search size={19} aria-hidden="true" />Search</button>
          <SearchQuickChips onPick={onClose} />
        </form>
      </div>
    </div>
  );
}

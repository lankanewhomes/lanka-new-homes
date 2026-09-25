"use client";

import Link from "next/link";
import { Scale, X } from "lucide-react";
import { compareEntryLabel, useCompareListings } from "@/lib/use-compare-listings";

// Floating bar, mounted once in the root layout (site-wide) — appears once
// 1+ listings are picked for comparison via the Scale button on
// ListingGridCard. Compare is a no-login localStorage convenience, so this
// bar (not a page) is the only place a visitor sees what they've picked
// before jumping to the full /compare table.
export function CompareBar() {
  const { entries, remove, clear } = useCompareListings();

  if (entries.length === 0) return null;

  const sameType = entries.every((e) => e.type === entries[0].type);
  const compareHref = `/compare?type=${entries[0].type}&slugs=${entries.map((e) => e.slug).join(",")}`;

  return (
    <div className="compare-bar" role="region" aria-label="Compare listings">
      <div className="compare-bar-inner">
        <span className="compare-bar-icon" aria-hidden="true">
          <Scale className="h-4 w-4" />
        </span>
        <span className="compare-bar-count">{entries.length} listing{entries.length === 1 ? "" : "s"} selected</span>
        <div className="compare-bar-chips">
          {entries.map((entry) => {
            const label = compareEntryLabel(entry);
            return (
              <span key={entry.slug} className="compare-bar-chip" title={label}>
                <span className="compare-bar-chip-label">{label}</span>
                <button type="button" aria-label={`Remove ${label} from compare`} onClick={() => remove(entry.slug)}>
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </div>
        <div className="compare-bar-actions">
          <button type="button" className="compare-bar-clear" onClick={clear}>
            Clear
          </button>
          {!sameType ? (
            <span className="compare-bar-mixed-note">Mix of projects &amp; land — compare separately</span>
          ) : entries.length < 2 ? (
            <span className="compare-bar-cta disabled" aria-disabled="true" title="Pick at least one more listing">
              Compare
            </span>
          ) : (
            <Link href={compareHref} className="compare-bar-cta">
              Compare
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

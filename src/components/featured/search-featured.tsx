"use client";

import Link from "next/link";
import { FeaturedTrack } from "@/components/featured/featured-track";
import type { FeaturedTier } from "@/lib/featured/config";

// Paid Featured projects that match what the buyer is typing, shown as photo cards in the phone search pop-up (placement
// "search-autocomplete": Premium and Elite, see PLACEMENT_MIN_TIER). One swipeable row above the suggestions so it stays on screen
// with the keyboard open; best tier first, as sent by /api/search/suggest. Each card counts one view and its clicks.
export type FeaturedSuggestion = { slug: string; name: string; place: string; href: string; image: string; developer: string; tier: FeaturedTier };

/** Reads the `featured` list of an /api/search/suggest answer; anything unexpected becomes an empty list. */
export function readFeaturedSuggestions(data: unknown): FeaturedSuggestion[] {
  const list = (data as { featured?: unknown } | null)?.featured;
  return Array.isArray(list) ? (list as FeaturedSuggestion[]).filter((item) => item?.slug && item?.href && item?.image) : [];
}

export function SearchFeaturedStrip({ items, onPick }: { items: FeaturedSuggestion[]; onPick: () => void }) {
  if (!items.length) return null;
  return (
    <section className="fp-search" aria-label="Featured projects">
      <p className="fp-search-head">Featured projects</p>
      <div className={`fp-search-row${items.length === 1 ? " fp-search-row--one" : ""}`}>
        {items.map((item) => (
          <FeaturedTrack key={item.slug} placement="search-autocomplete" projectSlug={item.slug} developer={item.developer} className="fp-search-item">
            <Link href={item.href} className="fp-search-card" onClick={onPick}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt="" width={96} height={72} loading="lazy" />
              <span>
                <em className="fp-badge">Featured</em>
                <strong>{item.name}</strong>
                {item.place ? <small>{item.place}</small> : null}
              </span>
            </Link>
          </FeaturedTrack>
        ))}
      </div>
    </section>
  );
}

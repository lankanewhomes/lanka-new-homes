"use client";

import { useEffect, useState } from "react";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { FeaturedTrack } from "@/components/featured/featured-track";
import type { Project } from "@/types";

// "You may also like", shown inside the enquiry / brochure thank-you state (a dialog, so it cannot be server-rendered with the page).
// Fetches featured projects near the one just enquired about; renders nothing while loading, on error, or when none match.
type Entry = { project: Project; tier: "featured" | "premium" | "elite"; developer: string };

export function AlsoLike({ slug }: { slug: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [demo, setDemo] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/featured/also-like?slug=${encodeURIComponent(slug)}`)
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setEntries(Array.isArray(data?.items) ? data.items : []);
        setDemo(Boolean(data?.demo));
      })
      .catch(() => setEntries([]));
    return () => {
      cancelled = true;
    };
  }, [slug]);
  if (entries.length === 0) return null;
  return (
    <div className="fp-alsolike">
      <h3>You may also like</h3>
      <div className="fp-grid">
        {entries.map((entry) => (
          <FeaturedTrack key={entry.project.slug} placement="thankyou-also-like" projectSlug={entry.project.slug} developer={entry.developer} demo={demo} className="fp-card">
            <ListingGridCard project={entry.project} featured={{ tier: entry.tier }} />
          </FeaturedTrack>
        ))}
      </div>
    </div>
  );
}

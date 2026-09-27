// The homepage "New listings" shelf is a time-boxed placement: a listing stays
// on it for 30 days after it went live (owner's placement spec, 2026-09-24 —
// "Free: appears in New listings for 30 days after going live"), then only
// organic search/city/collection/map placement remains. Pure and Payload-free
// so the homepage, the Supabase sync hook and tests can all share it.

export const NEW_LISTINGS_WINDOW_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Oldest "went live" moment still inside the window, as an ISO string. Computed
 * on the SERVER (page.tsx) and passed down as a prop, so the server-rendered
 * homepage and the client's hydration pass use the very same cutoff — computing
 * `Date.now()` inside the client component could disagree with the cached HTML
 * for a listing sitting right on the boundary and trip a hydration mismatch.
 */
export function newListingsCutoff(now: Date = new Date()): string {
  return new Date(now.getTime() - NEW_LISTINGS_WINDOW_DAYS * DAY_MS).toISOString();
}

/**
 * When the listing went live: the stamped `publishedAt` where there is one,
 * else the row's creation time (every listing that was already live before the
 * stamp existed — see `resolvePublishedAt`).
 */
export function wentLiveAt(project: { publishedAt?: string; createdAt?: string }): string | undefined {
  return project.publishedAt || project.createdAt || undefined;
}

export function isInNewListingsWindow(project: { publishedAt?: string; createdAt?: string }, cutoffIso: string): boolean {
  const live = Date.parse(wentLiveAt(project) ?? "");
  const cutoff = Date.parse(cutoffIso);
  return Number.isFinite(live) && Number.isFinite(cutoff) && live >= cutoff;
}

/**
 * The `publishedAt` to store on a project when it syncs to Supabase — the
 * moment it FIRST went live, kept for good once set (re-saving or a later
 * unpublish/republish never resets the 30 days).
 *  - already stamped → keep it;
 *  - not published now → nothing yet;
 *  - published now with no stamp:
 *      · the row was already live before stamping existed → its creation time
 *        (an edit to an old listing must not make it "new" again);
 *      · otherwise (first save, or it was a draft until now) → now.
 */
export function resolvePublishedAt(input: {
  isPublishedNow: boolean;
  existing: { publishedAt?: string; wasLive: boolean; createdAt?: string } | null;
  nowIso: string;
}): string | undefined {
  const { isPublishedNow, existing, nowIso } = input;
  if (existing?.publishedAt) return existing.publishedAt;
  if (!isPublishedNow) return undefined;
  if (existing?.wasLive && existing.createdAt) return existing.createdAt;
  return nowIso;
}

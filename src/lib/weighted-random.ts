// Shared by hero-ad-store.ts (server, Supabase-backed hero slides) and
// home-client.tsx (client, the homepage "Featured projects" section) — both
// need the same "more paid items than slots, so rotate weighted by plan"
// behavior (owner, 2026-09-24 build notes: "rotate homepage slots randomly
// on each page load, weighted by plan"). Pure/no dependencies so it's safe
// to import from either a server module or a "use client" component.
//
// Efraimidis-Spirakis weighted random sampling without replacement: give
// each item a key = U^(1/weight) (U uniform in (0,1]) and take the ones
// with the highest keys. A weight-4 item is far more likely to land in the
// top N than a weight-1 one, but never guaranteed and never the only one
// shown — every eligible item keeps a nonzero chance on every call.
export function weightedTake<T>(items: T[], count: number, weightOf: (item: T) => number): T[] {
  return items
    .map((item) => ({ item, key: Math.random() ** (1 / Math.max(1, weightOf(item))) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, count)
    .map((entry) => entry.item);
}

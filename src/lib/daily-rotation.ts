// Daily rotation for homepage shelves (owner, 2026-10-21: "keep rotating the listings every day"). The order is a shuffle seeded by the
// Sri Lanka calendar date, so every visitor sees the same picks all day and they change at midnight Sri Lanka time. The seed is computed on
// the SERVER (page.tsx) and passed down, so the cached HTML and the client's hydration pass always agree.

export function rotationSeed(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

// FNV-1a hash of the seed text, then mulberry32: small, deterministic, and good enough to shuffle a list.
function seededRandom(seed: string): () => number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const random = seededRandom(seed)
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Today's `count` picks. At or under `count` items nothing rotates (all are shown, in the given order). Over it, a seeded shuffle picks
 * them; `groupOf` + `maxPerGroup` stop one developer filling the whole shelf (extra slots are back-filled if there are too few groups).
 */
export function dailyPick<T>(items: readonly T[], count: number, seed: string, opts: { groupOf?: (item: T) => string; maxPerGroup?: number } = {}): T[] {
  if (items.length <= count) return [...items]
  const shuffled = seededShuffle(items, seed)
  const { groupOf, maxPerGroup } = opts
  if (!groupOf || !maxPerGroup) return shuffled.slice(0, count)
  const taken = new Map<string, number>()
  const picked: T[] = []
  const skipped: T[] = []
  for (const item of shuffled) {
    const group = groupOf(item)
    if ((taken.get(group) ?? 0) < maxPerGroup) {
      taken.set(group, (taken.get(group) ?? 0) + 1)
      picked.push(item)
    } else skipped.push(item)
    if (picked.length === count) return picked
  }
  return [...picked, ...skipped].slice(0, count)
}

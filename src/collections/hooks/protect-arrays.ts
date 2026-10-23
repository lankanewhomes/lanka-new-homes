/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionBeforeChangeHook } from 'payload'

// Safety net (2026-10-23). On 2026-10-20..22 several live listings lost their gallery / floor plans / nearby places in Payload (the Supabase
// mirror and R2 kept the data; cause not found). A save that submits one of these lists as EMPTY while the stored record has rows is almost
// never intended, so it is refused here: the stored rows are kept and a warning is logged with who/what sent it, so the culprit shows up next
// time. Deliberately clearing a list: set `req.context.allowEmptyArrays = true` in the calling script.

export const PROJECT_PROTECTED_ARRAYS = ['gallery', 'floorPlans', 'nearby', 'amenities', 'unitFeatures'] as const
export const LAND_PROTECTED_ARRAYS = ['gallery', 'plots', 'nearby', 'blockPlanImages'] as const

export function keepRowsWhenWipedBy(data: Record<string, any>, previous: Record<string, any> | undefined, keys: readonly string[]): { data: Record<string, any>; kept: string[] } {
  if (!data || !previous) return { data, kept: [] }
  const kept: string[] = []
  const next = { ...data }
  for (const key of keys) {
    const incoming = next[key]
    const before = previous[key]
    if (Array.isArray(incoming) && incoming.length === 0 && Array.isArray(before) && before.length > 0) {
      next[key] = before
      kept.push(`${key}(${before.length})`)
    }
  }
  return { data: next, kept }
}

export const protectArrays =
  (keys: readonly string[], label: string): CollectionBeforeChangeHook =>
  ({ data, originalDoc, operation, req }) => {
    if (operation !== 'update' || req.context?.allowEmptyArrays) return data
    const { data: next, kept } = keepRowsWhenWipedBy(data, originalDoc as Record<string, any> | undefined, keys)
    if (kept.length) {
      req.payload.logger.warn(
        { slug: (originalDoc as any)?.slug, kept, user: (req.user as any)?.email ?? null, url: (req as any).url ?? null },
        `${label}: a save tried to empty lists that have rows; the rows were kept`,
      )
    }
    return next
  }

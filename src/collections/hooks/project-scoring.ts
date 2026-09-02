import type { CollectionBeforeChangeHook } from 'payload'

// Named weights so the formula is easy to retune later without hunting
// through the hook body:
//   final_score = completeness_score * COMPLETENESS_WEIGHT
//                + (view_count * VIEW_WEIGHT + save_count * SAVE_WEIGHT + lead_count * LEAD_WEIGHT)
//                + recencyScore (decays RECENCY_MAX_POINTS -> 0 over RECENCY_WINDOW_DAYS)
//                + paid_boost
const COMPLETENESS_WEIGHT = 0.3
const VIEW_WEIGHT = 0.1
const SAVE_WEIGHT = 1
const LEAD_WEIGHT = 3
const RECENCY_MAX_POINTS = 20
const RECENCY_WINDOW_DAYS = 90

type ScoredProjectData = {
  name?: unknown
  developer?: unknown
  location?: unknown
  status?: unknown
  type?: unknown
  startingPriceLkr?: unknown
  bedrooms?: unknown
  bathrooms?: unknown
  floorAreaRange?: unknown
  units?: unknown
  floors?: unknown
  description?: unknown
  heroImage?: unknown
  gallery?: unknown
  amenities?: unknown
  floorPlans?: unknown
  coordinates?: { lat?: unknown; lng?: unknown }
  contact?: { name?: unknown; email?: unknown; phone?: unknown }
  view_count?: unknown
  save_count?: unknown
  lead_count?: unknown
  paid_boost?: unknown
  createdAt?: unknown
}

const COMPLETENESS_CHECKS: ((data: ScoredProjectData) => boolean)[] = [
  (d) => Boolean(d.name),
  (d) => Boolean(d.developer),
  (d) => Boolean(d.location),
  (d) => Boolean(d.status),
  (d) => Boolean(d.type),
  (d) => typeof d.startingPriceLkr === 'number' && d.startingPriceLkr > 0,
  (d) => Boolean(d.bedrooms),
  (d) => Boolean(d.bathrooms),
  (d) => Boolean(d.floorAreaRange),
  (d) => typeof d.units === 'number' && d.units > 0,
  (d) => typeof d.floors === 'number' && d.floors > 0,
  (d) => Boolean(d.description),
  (d) => Boolean(d.heroImage),
  (d) => Array.isArray(d.gallery) && d.gallery.length > 0,
  (d) => Array.isArray(d.amenities) && d.amenities.length > 0,
  (d) => Array.isArray(d.floorPlans) && d.floorPlans.length > 0,
  (d) => typeof d.coordinates?.lat === 'number' && typeof d.coordinates?.lng === 'number',
  (d) => Boolean(d.contact?.name && d.contact?.email && d.contact?.phone),
]

export function computeCompletenessScore(data: ScoredProjectData): number {
  const filled = COMPLETENESS_CHECKS.filter((check) => check(data)).length
  return Math.round((filled / COMPLETENESS_CHECKS.length) * 100)
}

function computeRecencyScore(createdAt: unknown): number {
  if (typeof createdAt !== 'string') return RECENCY_MAX_POINTS
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  const remainingFraction = 1 - ageDays / RECENCY_WINDOW_DAYS
  return Math.max(0, Math.round(remainingFraction * RECENCY_MAX_POINTS))
}

export function computeFinalScore(data: ScoredProjectData, completenessScore: number): number {
  const viewCount = typeof data.view_count === 'number' ? data.view_count : 0
  const saveCount = typeof data.save_count === 'number' ? data.save_count : 0
  const leadCount = typeof data.lead_count === 'number' ? data.lead_count : 0
  const paidBoost = typeof data.paid_boost === 'number' ? data.paid_boost : 0

  const engagementScore = viewCount * VIEW_WEIGHT + saveCount * SAVE_WEIGHT + leadCount * LEAD_WEIGHT
  const recencyScore = computeRecencyScore(data.createdAt)

  return Math.round(completenessScore * COMPLETENESS_WEIGHT + engagementScore + recencyScore + paidBoost)
}

const VERIFICATION_CHECKLIST_FIELDS = [
  'verification_developer_verified',
  'verification_address_verified',
  'verification_price_verified',
  'verification_floor_plans_verified',
  'verification_completion_date_verified',
  'verification_ownership_verified',
  'verification_documents_verified',
] as const

function computeIsVerified(merged: Record<string, unknown>): boolean {
  return VERIFICATION_CHECKLIST_FIELDS.every((field) => merged[field] === true)
}

// Recomputes on every save so admin edits, API writes, and the count-
// increment hooks (hooks/increment-counts.ts) all keep this current.
export const scoreProjectBeforeChange: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const merged: ScoredProjectData & Record<string, unknown> = { ...(originalDoc ?? {}), ...data }
  const completeness_score = computeCompletenessScore(merged)
  const final_score = computeFinalScore(merged, completeness_score)
  const isVerified = computeIsVerified(merged)
  return { ...data, completeness_score, final_score, isVerified }
}

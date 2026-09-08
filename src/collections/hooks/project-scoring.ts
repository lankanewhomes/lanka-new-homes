import type { CollectionBeforeChangeHook } from 'payload'
import { COMPLETENESS_WEIGHT, computeCompletenessScore, type CompletenessData } from '@/lib/completeness'

// Named weights so the formula is easy to retune later without hunting
// through the hook body:
//   final_score = completeness_score * COMPLETENESS_WEIGHT
//                + (view_count * VIEW_WEIGHT + save_count * SAVE_WEIGHT + lead_count * LEAD_WEIGHT)
//                + recencyScore (decays RECENCY_MAX_POINTS -> 0 over RECENCY_WINDOW_DAYS)
//                + paid_boost
// COMPLETENESS_WEIGHT and the checklist itself live in src/lib/completeness.ts
// so the developer-facing to-do list shows exactly what this hook scores.
const VIEW_WEIGHT = 0.1
const SAVE_WEIGHT = 1
const LEAD_WEIGHT = 3
const RECENCY_MAX_POINTS = 20
const RECENCY_WINDOW_DAYS = 90

type ScoredProjectData = CompletenessData & {
  view_count?: unknown
  save_count?: unknown
  lead_count?: unknown
  paid_boost?: unknown
  createdAt?: unknown
}

export { computeCompletenessScore }

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

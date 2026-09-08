// "Responds within 1 hour" — earned from real reply times, never claimed.
//
// Over the last RESPONSE_BADGE_WINDOW_DAYS, every lead on the developer's
// projects that is at least an hour old counts; the share answered (moved
// off "New", see hooks/lead-hooks.ts stampFirstResponse) within 60 minutes
// is the rate. Unanswered leads count against it once they pass the hour —
// so ignoring inquiries loses the badge, not just answering slowly. Badge =
// at least RESPONSE_BADGE_MIN_SAMPLE such leads and a rate of at least
// RESPONSE_BADGE_MIN_RATE_PERCENT. Recomputed when a lead is first
// answered, and weekly by the analytics-digest cron so it decays as the
// window slides.

import type { Payload, PayloadRequest } from 'payload'

export const RESPONSE_BADGE_WINDOW_DAYS = 90
export const RESPONSE_BADGE_MIN_SAMPLE = 5
export const RESPONSE_BADGE_MIN_RATE_PERCENT = 80
export const RESPONSE_BADGE_LIMIT_MINUTES = 60
export const RESPONSE_BADGE_LABEL = 'Responds within 1 hour'

export type ResponseStats = {
  earned: boolean
  /** Leads in the window that are old enough to judge (≥ 1 hour). */
  sampleSize: number
  /** 0–100 share of those answered within the hour; null with no sample. */
  withinHourRatePercent: number | null
  /** Median minutes over answered leads in the window; null when none. */
  medianMinutes: number | null
  windowDays: number
  minSample: number
  minRatePercent: number
}

type LeadForStats = { createdAt?: unknown; response_minutes?: unknown; first_response_at?: unknown }

/** Pure: stats from a developer's leads at `now`. */
export function computeResponseStats(leads: LeadForStats[], now: Date = new Date()): ResponseStats {
  const windowStart = now.getTime() - RESPONSE_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const judgeBefore = now.getTime() - RESPONSE_BADGE_LIMIT_MINUTES * 60 * 1000
  let sample = 0
  let withinHour = 0
  const answered: number[] = []
  for (const lead of leads) {
    const created = typeof lead.createdAt === 'string' ? new Date(lead.createdAt).getTime() : NaN
    if (!Number.isFinite(created) || created < windowStart) continue
    const minutes = typeof lead.response_minutes === 'number' && Number.isFinite(lead.response_minutes) ? lead.response_minutes : null
    if (minutes !== null) answered.push(minutes)
    const fastReply = minutes !== null && minutes <= RESPONSE_BADGE_LIMIT_MINUTES
    // A lead younger than an hour that is still unanswered is not judged yet.
    if (!fastReply && created > judgeBefore) continue
    sample += 1
    if (fastReply) withinHour += 1
  }
  answered.sort((a, b) => a - b)
  const rate = sample > 0 ? Math.round((withinHour / sample) * 100) : null
  return {
    earned: sample >= RESPONSE_BADGE_MIN_SAMPLE && rate !== null && rate >= RESPONSE_BADGE_MIN_RATE_PERCENT,
    sampleSize: sample,
    withinHourRatePercent: rate,
    medianMinutes: answered.length ? answered[Math.floor((answered.length - 1) / 2)] : null,
    windowDays: RESPONSE_BADGE_WINDOW_DAYS,
    minSample: RESPONSE_BADGE_MIN_SAMPLE,
    minRatePercent: RESPONSE_BADGE_MIN_RATE_PERCENT,
  }
}

export async function loadLeadsForProjects(payload: Payload, projectIds: (string | number)[], req?: PayloadRequest): Promise<LeadForStats[]> {
  if (!projectIds.length) return []
  const since = new Date(Date.now() - RESPONSE_BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { docs } = await payload.find({
    collection: 'leads',
    where: { and: [{ project: { in: projectIds } }, { createdAt: { greater_than_equal: since } }] },
    limit: 5000,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return docs
}

/** Recompute and store `response_stats` on one developer (syncs to Supabase
 * via the collection hook). Pass `req` from inside a hook so the reads see
 * that request's uncommitted lead update. */
export async function recomputeDeveloperResponseStats(payload: Payload, developerId: string | number, req?: PayloadRequest): Promise<ResponseStats> {
  const { docs: projects } = await payload.find({ collection: 'projects', where: { developer: { equals: developerId } }, limit: 500, depth: 0, overrideAccess: true, req })
  const leads = await loadLeadsForProjects(payload, projects.map((p) => p.id), req)
  const stats = computeResponseStats(leads)
  await payload.update({
    collection: 'developers',
    id: developerId,
    data: {
      response_stats: {
        responds_within_hour: stats.earned,
        within_hour_rate: stats.withinHourRatePercent,
        median_minutes: stats.medianMinutes,
        sample_size: stats.sampleSize,
        computed_at: new Date().toISOString(),
      },
    } as never,
    overrideAccess: true,
    context: { skipResponseStats: true },
    req,
  })
  return stats
}

/** Weekly sweep (analytics-digest cron): every developer, so the badge decays as the window slides. */
export async function recomputeAllDeveloperResponseStats(payload: Payload): Promise<{ developers: number; earned: number }> {
  const { docs } = await payload.find({ collection: 'developers', limit: 1000, depth: 0, overrideAccess: true })
  let earned = 0
  for (const developer of docs) {
    const stats = await recomputeDeveloperResponseStats(payload, developer.id)
    if (stats.earned) earned += 1
  }
  return { developers: docs.length, earned }
}

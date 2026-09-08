import type { Payload, Where } from 'payload'
import { LEAD_STATUS_OPTIONS } from '@/collections/Leads'

// Lead pipeline + response-time summary for the /cms Analytics dashboard
// (and, later, the "responds within 1 hour" developer badge). All-time,
// not date-range scoped: a lead's stage is where it stands today.
export type LeadPipelineSummary = {
  total: number
  stages: { status: string; label: string; count: number }[]
  /** Leads still in "New" — nobody has replied yet. */
  awaitingReply: number
  /** Over leads that have a first response; null when none yet. */
  avgResponseMinutes: number | null
  medianResponseMinutes: number | null
  /** Share of responded leads answered within an hour, 0–100; null when none. */
  respondedWithinHourPercent: number | null
  respondedCount: number
}

export async function buildLeadPipelineSummary(payload: Payload, projectIds?: (string | number)[]): Promise<LeadPipelineSummary> {
  const where: Where = projectIds ? { project: { in: projectIds } } : {}
  const { docs } = await payload.find({ collection: 'leads', where, limit: 5000, depth: 0, overrideAccess: true })

  const counts = new Map<string, number>()
  for (const option of LEAD_STATUS_OPTIONS) counts.set(option.value, 0)
  const responseTimes: number[] = []
  for (const doc of docs) {
    const status = typeof doc.status === 'string' ? doc.status : 'new'
    counts.set(status, (counts.get(status) ?? 0) + 1)
    if (typeof doc.response_minutes === 'number' && Number.isFinite(doc.response_minutes)) responseTimes.push(doc.response_minutes)
  }

  responseTimes.sort((a, b) => a - b)
  const respondedCount = responseTimes.length
  const avg = respondedCount ? Math.round(responseTimes.reduce((sum, m) => sum + m, 0) / respondedCount) : null
  const median = respondedCount ? responseTimes[Math.floor((respondedCount - 1) / 2)] : null
  const withinHour = respondedCount ? Math.round((responseTimes.filter((m) => m <= 60).length / respondedCount) * 100) : null

  return {
    total: docs.length,
    stages: LEAD_STATUS_OPTIONS.map((option) => ({ status: option.value, label: option.label, count: counts.get(option.value) ?? 0 })),
    awaitingReply: counts.get('new') ?? 0,
    avgResponseMinutes: avg,
    medianResponseMinutes: median,
    respondedWithinHourPercent: withinHour,
    respondedCount,
  }
}

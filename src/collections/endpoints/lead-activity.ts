import type { Endpoint } from 'payload'
import { isAdmin } from '../access'

// GET /payload-api/lead-activity?days=30 — admin-only feed for the "Lead
// activity" page (/cms/lead-activity): every lead in the period with who
// was alerted, whether they answered, how and how fast, plus a
// per-developer scoreboard. Read straight from Payload's leads (the source
// of truth for status / alerts / reply events).

export type LeadActivityRow = {
  id: string | number
  createdAt: string
  buyer: { name: string; phone: string; email: string; preferred: string }
  project: { id: string | number | null; name: string; slug: string }
  developer: { id: string | number | null; name: string; slug: string }
  source: string
  floorPlan: string
  message: string
  status: string
  alertSummary: string
  alertLog: { channel: string; to: string; status: string; routing: string; at: string }[]
  firstReplyVia: string | null
  firstResponseAt: string | null
  responseMinutes: number | null
  replyEvents: { via: string; source: string; at: string; country: string; city: string; device: string }[]
  /** Where the buyer was when they asked (Vercel geo + device); blank for hand-added leads. */
  origin: { country: string; region: string; city: string; device: string; trafficSource: string; referrer: string }
}

export type DeveloperScoreRow = {
  id: string | number
  name: string
  slug: string
  leads: number
  awaiting: number
  answered: number
  avgMinutes: number | null
  withinHourPercent: number | null
  alertsFailed: number
  badge: boolean
}

export type LeadActivityResponse = {
  days: number
  totals: { leads: number; awaiting: number; answered: number; alertsFailed: number; avgMinutes: number | null; withinHourPercent: number | null }
  leads: LeadActivityRow[]
  developers: DeveloperScoreRow[]
}

type AnyDoc = Record<string, unknown>
const text = (value: unknown): string => (typeof value === 'string' ? value : '')
const relId = (value: unknown): string | number | null => (value && typeof value === 'object' && 'id' in value ? (value as { id: string | number }).id : (value as string | number | null) ?? null)

export const leadActivityEndpoint: Endpoint = {
  path: '/lead-activity',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Not signed in.' }, { status: 401 })
    if (!isAdmin(req)) return Response.json({ error: 'Admins only.' }, { status: 403 })

    const url = new URL(req.url ?? '', 'http://localhost')
    const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // depth 2: lead.project → project.developer as docs.
    const { docs } = await req.payload.find({
      collection: 'leads',
      where: { createdAt: { greater_than_equal: since } },
      sort: '-createdAt',
      limit: 500,
      depth: 2,
      overrideAccess: true,
      req,
    })

    const leads: LeadActivityRow[] = docs.map((doc) => {
      const d = doc as unknown as AnyDoc
      const project = (d.project && typeof d.project === 'object' ? d.project : null) as AnyDoc | null
      const developer = (project?.developer && typeof project.developer === 'object' ? project.developer : null) as AnyDoc | null
      return {
        id: doc.id,
        createdAt: text(d.createdAt),
        buyer: { name: text(d.name), phone: text(d.phone), email: text(d.email), preferred: text(d.preferred_contact_method) },
        project: { id: project ? (project.id as string | number) : relId(d.project), name: text(project?.name), slug: text(project?.slug) },
        developer: { id: developer ? (developer.id as string | number) : relId(project?.developer), name: text(developer?.name), slug: text(developer?.slug) },
        source: text(d.source) || 'request_info',
        floorPlan: text(d.floor_plan),
        message: text(d.message),
        status: text(d.status) || 'new',
        alertSummary: text(d.alert_summary),
        alertLog: (Array.isArray(d.alert_log) ? (d.alert_log as AnyDoc[]) : []).map((e) => ({ channel: text(e.channel), to: text(e.to), status: text(e.status), routing: text(e.routing), at: text(e.at) })),
        firstReplyVia: text(d.first_reply_via) || null,
        firstResponseAt: text(d.first_response_at) || null,
        responseMinutes: typeof d.response_minutes === 'number' ? d.response_minutes : null,
        replyEvents: (Array.isArray(d.reply_events) ? (d.reply_events as AnyDoc[]) : []).map((e) => ({ via: text(e.via), source: text(e.source), at: text(e.at), country: text(e.country), city: text(e.city), device: text(e.device) })),
        origin: {
          country: text((d.origin as AnyDoc | undefined)?.country),
          region: text((d.origin as AnyDoc | undefined)?.region),
          city: text((d.origin as AnyDoc | undefined)?.city),
          device: text((d.origin as AnyDoc | undefined)?.device),
          trafficSource: text((d.origin as AnyDoc | undefined)?.traffic_source),
          referrer: text((d.origin as AnyDoc | undefined)?.referrer),
        },
      }
    })

    // Per-developer scoreboard over the same period + their live badge.
    const byDeveloper = new Map<string, DeveloperScoreRow & { minutes: number[]; docs: AnyDoc[] }>()
    for (const row of leads) {
      const key = String(row.developer.id ?? 'none')
      const entry = byDeveloper.get(key) ?? { id: row.developer.id ?? 'none', name: row.developer.name || '(no developer)', slug: row.developer.slug, leads: 0, awaiting: 0, answered: 0, avgMinutes: null, withinHourPercent: null, alertsFailed: 0, badge: false, minutes: [], docs: [] }
      entry.leads += 1
      if (row.status === 'new') entry.awaiting += 1
      if (row.responseMinutes !== null) {
        entry.answered += 1
        entry.minutes.push(row.responseMinutes)
      }
      if (row.alertLog.some((e) => e.status === 'failed')) entry.alertsFailed += 1
      byDeveloper.set(key, entry)
    }
    const developerIds = Array.from(byDeveloper.values()).map((e) => e.id).filter((id) => id !== 'none')
    const developerDocs = developerIds.length
      ? (await req.payload.find({ collection: 'developers', where: { id: { in: developerIds } }, limit: 200, depth: 0, overrideAccess: true, req })).docs
      : []
    const badgeById = new Map(developerDocs.map((d) => [String(d.id), Boolean(((d as unknown as AnyDoc).response_stats as AnyDoc | undefined)?.responds_within_hour)]))

    const developers: DeveloperScoreRow[] = Array.from(byDeveloper.values())
      .map(({ minutes, docs: _unused, ...entry }) => {
        const withinHour = minutes.filter((m) => m <= 60).length
        return {
          ...entry,
          avgMinutes: minutes.length ? Math.round(minutes.reduce((a, b) => a + b, 0) / minutes.length) : null,
          withinHourPercent: minutes.length ? Math.round((withinHour / minutes.length) * 100) : null,
          badge: badgeById.get(String(entry.id)) ?? false,
        }
      })
      .sort((a, b) => b.leads - a.leads)

    const allMinutes = leads.map((l) => l.responseMinutes).filter((m): m is number => m !== null)
    const totals = {
      leads: leads.length,
      awaiting: leads.filter((l) => l.status === 'new').length,
      answered: allMinutes.length,
      alertsFailed: leads.filter((l) => l.alertLog.some((e) => e.status === 'failed')).length,
      avgMinutes: allMinutes.length ? Math.round(allMinutes.reduce((a, b) => a + b, 0) / allMinutes.length) : null,
      withinHourPercent: allMinutes.length ? Math.round((allMinutes.filter((m) => m <= 60).length / allMinutes.length) * 100) : null,
    }

    return Response.json({ days, totals, leads, developers } satisfies LeadActivityResponse)
  },
}

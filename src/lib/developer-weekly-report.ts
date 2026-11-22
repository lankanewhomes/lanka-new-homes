import type { Payload } from 'payload'
import { ANALYTICS_START, fromAnalyticsStart } from './analytics-start'
import { developerWeeklyReportSubject, renderDeveloperWeeklyReportHTML, weeklyReportRange, type DeveloperWeeklyReportInput } from './developer-weekly-report-email'
import { PLACEMENT_LABEL, type Placement } from './featured/config'
import { supabaseAdmin } from './supabase'

// Builds and sends the developer weekly report (owner, 2026-11-22: "every sunday we need to send"). The Cloudflare worker calls
// /api/cron/developer-weekly-report on Sundays (cloudflare/worker.js). The week is the 7 full UTC days before the run: Sunday to Saturday.
// Only data from 11 Oct 2026 on is counted (owner, 2026-11-22: "only count data from october 11"), the same start as every other
// analytics screen (analytics-start.ts). That also applies to "buyers waiting": older enquiries still marked New are not counted.
// Views come from Supabase project_views, enquiries from Supabase leads, the address and account/verified status from the Payload developer.

const DAY = 86400000
const FROM = 'developers@lankanewhomes.com'
const SITE = 'https://www.lankanewhomes.com'

export type WeeklyReport = { slug: string; to: string | null; subject: string; input: DeveloperWeeklyReportInput }

type Ev = { project_slug: string; developer_slug: string; event_type: string; viewed_at: string }
type Feat = { developer_slug: string | null; event: string; placement: string }
type Lead = { project_slug: string; developer_slug: string; status: string; created_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Supabase query builder type changes with every chained call
type Query = any

async function all<T>(table: string, columns: string, filter: (q: Query) => Query): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await filter(supabaseAdmin.from(table).select(columns)).range(from, from + 999)
    if (error) throw error
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return rows
  }
}

/** One report per developer that had at least one view or enquiry in the week, most views first. `now` is only for tests and previews. */
export async function buildDeveloperWeeklyReports(payload: Payload, now = new Date()): Promise<WeeklyReport[]> {
  const end = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z') // today 00:00 UTC, exclusive
  const start = new Date(end.getTime() - 7 * DAY)
  const prevStart = new Date(end.getTime() - 14 * DAY)
  const [startIso, endIso] = [start.toISOString(), end.toISOString()]

  const [events, leads, projects, developers, featured] = await Promise.all([
    all<Ev>('project_views', 'project_slug,developer_slug,event_type,viewed_at', (q) => q.eq('event_type', 'view').gte('viewed_at', fromAnalyticsStart(prevStart.toISOString())).lt('viewed_at', endIso).order('id')),
    all<Lead>('leads', 'project_slug,developer_slug,status,created_at', (q) => q.gte('created_at', ANALYTICS_START).lt('created_at', endIso).order('created_at')),
    all<{ slug: string; name: string }>('projects', 'slug,name', (q) => q.order('slug')),
    payload.find({ collection: 'developers', limit: 1000, depth: 0, overrideAccess: true }),
    // Featured placements (paid packages): times shown, clicks and leads this week. Empty for developers without a package.
    all<Feat>('featured_events', 'developer_slug,event,placement', (q) => q.gte('at', startIso).lt('at', endIso).order('id')).catch(() => [] as Feat[]),
  ])
  const nameOf = new Map(projects.map((p) => [p.slug, p.name]))
  const thisWeek = (iso: string) => iso >= startIso
  const lastWeek = (iso: string) => iso >= prevStart.toISOString() && iso < startIso

  const reports: WeeklyReport[] = []
  for (const dev of developers.docs as unknown as { slug?: string; name: string; hide_from_site?: boolean; user?: unknown; domain_verified?: boolean; contact_email?: string | null; lead_alerts?: { email?: string | null } | null }[]) {
    const slug = dev.slug ?? ''
    if (!slug || dev.hide_from_site) continue
    const views = events.filter((e) => e.developer_slug === slug)
    const mine = leads.filter((l) => l.developer_slug === slug)
    const weekViews = views.filter((e) => thisWeek(e.viewed_at))
    const weekLeads = mine.filter((l) => thisWeek(l.created_at))
    if (!weekViews.length && !weekLeads.length && !featured.some((f) => f.developer_slug === slug)) continue
    const listings = [...new Set([...weekViews.map((e) => e.project_slug), ...weekLeads.map((l) => l.project_slug)])]
      .filter((s) => nameOf.has(s))
      .map((s) => ({ name: nameOf.get(s)!, url: `${SITE}/projects/${s}`, views: weekViews.filter((e) => e.project_slug === s).length, enquiries: weekLeads.filter((l) => l.project_slug === s).length }))
    const byPlacement = new Map<string, { impressions: number; clicks: number; leads: number }>()
    for (const f of featured) {
      if (f.developer_slug !== slug) continue
      const row = byPlacement.get(f.placement) ?? { impressions: 0, clicks: 0, leads: 0 }
      if (f.event === 'impression') row.impressions += 1
      else if (f.event === 'click') row.clicks += 1
      else if (f.event === 'lead') row.leads += 1
      byPlacement.set(f.placement, row)
    }
    const input: DeveloperWeeklyReportInput = {
      developerName: dev.name,
      developerSlug: slug,
      hasAccount: Boolean(dev.user),
      verified: Boolean(dev.domain_verified),
      from: start,
      to: new Date(end.getTime() - DAY),
      views: weekViews.length,
      previousViews: views.filter((e) => lastWeek(e.viewed_at)).length,
      enquiries: weekLeads.length,
      previousEnquiries: mine.filter((l) => lastWeek(l.created_at)).length,
      waitingForReply: mine.filter((l) => l.status === 'New').length,
      listings,
      featured: [...byPlacement].map(([placement, c]) => ({ label: PLACEMENT_LABEL[placement as Placement] ?? placement, ...c })).sort((a, b) => b.impressions - a.impressions),
      dashboardUrl: `${SITE}/developers/dashboard`,
    }
    const to = String(dev.lead_alerts?.email || dev.contact_email || '').trim() || null
    reports.push({ slug, to, subject: developerWeeklyReportSubject(input), input })
  }
  return reports.sort((a, b) => b.input.views - a.input.views)
}

/** Sends this week's report to every developer with activity and an address on file. A developer who already got this week's report is skipped, so a second run sends nothing twice. */
export async function sendDeveloperWeeklyReports(payload: Payload, now = new Date()): Promise<{ sent: string[]; skipped: { slug: string; why: string }[]; failed: { slug: string; error: string }[] }> {
  const { sendMail } = await import('./mailer')
  const reports = await buildDeveloperWeeklyReports(payload, now)
  const out = { sent: [] as string[], skipped: [] as { slug: string; why: string }[], failed: [] as { slug: string; error: string }[] }
  for (const r of reports) {
    if (!r.to) { out.skipped.push({ slug: r.slug, why: 'no email on file' }); continue }
    try {
      const already = await payload.count({ collection: 'email-log' as never, where: { and: [{ toEmail: { contains: r.to } }, { subject: { contains: weeklyReportRange(r.input) } }, { subject: { contains: 'Your week on LankaNewHomes' } }] } as never, overrideAccess: true })
      if (already.totalDocs > 0) { out.skipped.push({ slug: r.slug, why: 'already sent this week' }); continue }
      await sendMail({ to: r.to, from: FROM, replyTo: FROM, subject: r.subject, html: renderDeveloperWeeklyReportHTML(r.input) })
      out.sent.push(r.slug)
    } catch (error) {
      out.failed.push({ slug: r.slug, error: error instanceof Error ? error.message : String(error) })
    }
  }
  return out
}

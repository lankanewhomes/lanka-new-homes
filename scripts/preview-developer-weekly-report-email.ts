// Preview of the developer weekly report email (src/lib/developer-weekly-report-email.ts). READ ONLY: sends nothing, writes nothing to Supabase.
// Uses real counts for the last 7 full days. Renders the TOP developers by views (default 1), or just DEVELOPER_SLUG if set. One HTML file each.
//   OUT_DIR=<folder> [TOP=5] [DEVELOPER_SLUG=<slug>] npx tsx scripts/preview-developer-weekly-report-email.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { supabaseAdmin } = await import('../src/lib/supabase')
const { renderDeveloperWeeklyReportHTML, developerWeeklyReportSubject } = await import('../src/lib/developer-weekly-report-email')

const payload = await (await import('payload')).getPayload({ config: ((await import('../payload.config')) as any).default })
const OUT = process.env.OUT_DIR
if (!OUT) throw new Error('Set OUT_DIR')
const DAY = 86400000
const end = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z') // today 00:00 UTC, exclusive
const start = new Date(end.getTime() - 7 * DAY)
const prevStart = new Date(end.getTime() - 14 * DAY)

type Ev = { project_slug: string; developer_slug: string; event_type: string; viewed_at: string }
async function events(): Promise<Ev[]> {
  const all: Ev[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from('project_views').select('project_slug,developer_slug,event_type,viewed_at').gte('viewed_at', prevStart.toISOString()).lt('viewed_at', end.toISOString()).order('id').range(from, from + 999)
    if (error) throw error
    all.push(...(data as Ev[]))
    if (!data || data.length < 1000) return all
  }
}
const evs = await events()
const thisWeek = (e: { viewed_at: string }) => e.viewed_at >= start.toISOString()

const byDev = new Map<string, number>()
for (const e of evs) if (thisWeek(e) && e.event_type === 'view' && e.developer_slug) byDev.set(e.developer_slug, (byDev.get(e.developer_slug) ?? 0) + 1)
const ranked = [...byDev.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s)
const targets = process.env.DEVELOPER_SLUG ? [process.env.DEVELOPER_SLUG] : ranked.slice(0, Number(process.env.TOP ?? 1))
if (!targets.length) throw new Error('No views in the last 7 days')
const inRange = (iso: string, a: Date, b: Date) => iso >= a.toISOString() && iso < b.toISOString()
fs.mkdirSync(OUT, { recursive: true })

let rank = 0
for (const slug of targets) {
  rank += 1
  const mine = evs.filter((e) => e.developer_slug === slug)
  const count = (types: string[], cur: boolean) => mine.filter((e) => types.includes(e.event_type) && thisWeek(e) === cur).length

  const { data: leads, error: leadErr } = await supabaseAdmin.from('leads').select('project_slug,status,created_at').eq('developer_slug', slug)
  if (leadErr) throw leadErr
  const { data: dev } = await supabaseAdmin.from('developers').select('name').eq('slug', slug).maybeSingle()
  const slugs = [...new Set([...mine.map((e) => e.project_slug), ...(leads ?? []).map((l) => l.project_slug)])]
  const { data: projects } = await supabaseAdmin.from('projects').select('slug,name').in('slug', slugs)
  const nameOf = new Map((projects ?? []).map((p) => [p.slug as string, p.name as string]))

  const listings = slugs
    .filter((s) => nameOf.has(s))
    .map((s) => ({
      name: nameOf.get(s)!,
      url: `https://www.lankanewhomes.com/projects/${s}`,
      views: mine.filter((e) => e.project_slug === s && e.event_type === 'view' && thisWeek(e)).length,
      enquiries: (leads ?? []).filter((l) => l.project_slug === s && inRange(l.created_at, start, end)).length,
    }))
    .filter((l) => l.views || l.enquiries)

  // Account and Verified status live on the Payload developer record.
  const rec = (await payload.find({ collection: 'developers', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
  const input = {
    developerName: (dev?.name as string) ?? slug,
    developerSlug: slug,
    hasAccount: Boolean(rec?.user),
    verified: Boolean(rec?.domain_verified),
    from: start,
    to: new Date(end.getTime() - DAY),
    views: count(['view'], true),
    previousViews: count(['view'], false),
    enquiries: (leads ?? []).filter((l) => inRange(l.created_at, start, end)).length,
    previousEnquiries: (leads ?? []).filter((l) => inRange(l.created_at, prevStart, start)).length,
    waitingForReply: (leads ?? []).filter((l) => l.status === 'New').length,
    listings,
    dashboardUrl: 'https://www.lankanewhomes.com/developers/dashboard',
  }
  fs.writeFileSync(`${OUT}/${rank}-${slug}.html`, renderDeveloperWeeklyReportHTML(input))
  console.log('New leads by month:', JSON.stringify((leads ?? []).filter((l) => l.status === 'New').reduce((m: Record<string, number>, l) => ((m[l.created_at.slice(0, 7)] = (m[l.created_at.slice(0, 7)] ?? 0) + 1), m), {})))
  console.log(JSON.stringify({ rank, slug, subject: developerWeeklyReportSubject(input), ...input, listings: listings.length }))
}
console.log('events read:', evs.length)
process.exit(0)

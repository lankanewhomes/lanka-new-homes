/* eslint-disable @typescript-eslint/no-explicit-any -- one-off */
// Copies the links the owner has shared (memory file project_source_links.md) into each listing's backend-only "Reference links"
// tab (owner, 2026-10-12). DRY RUN by default; APPLY=1 writes. Rows are inserted with SQL so no Supabase sync fires.
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const pool = (payload.db as any).pool

const memory = fs.readFileSync(path.join(process.env.HOME!, '.claude/projects/-Users-rupansinnarajah-Desktop-lankanewhomes/memory/project_source_links.md'), 'utf8').split('\n')
const clean = (u: string) => u.replace(/[),.;:]+$/, '')
type Target = { dev?: string; project?: string; land?: string }
const rules: [RegExp, (u: string) => Target[] | null][] = [
  [/oceana\.lk|homelandsdubai|O_dZGaK1yGc|propertyguide\.lk\/en\/new-projects\/oceana|bizin\.lk\/directory\/oceana/i, () => [{ project: 'oceana-wadduwa' }, { dev: 'home-lands' }]],
  [/primelands\.lk\/land\/([A-Z0-9-]+)\/en/i, (u) => { const m = u.match(/primelands\.lk\/land\/([A-Z0-9-]+)\/en/i); return [{ land: m![1].toLowerCase() }, { dev: 'prime-lands' }] }],
  [/primelands\.lk/i, () => [{ dev: 'prime-lands' }]],
  [/rush-city|projects40-rush-city/i, () => [{ project: 'rush-city-dematagoda' }]],
  [/rush-court-5/i, () => [{ project: 'rush-court-5-colombo-14' }]],
  [/rushlankagroup|rushgroup-s3/i, () => [{ dev: 'rush-lanka-group' }]],
  [/panimozhi/i, () => [{ project: 'panimozhi-club-house-kalkudah' }, { dev: 'excello-developers' }]],
  [/rushlankagroup\.com\/projects\/rush-court-6/i, () => [{ project: 'rush-court-6-mount-lavinia' }]],
  [/viman-ja-ela/i, () => [{ project: 'viman-ja-ela-apartments' }, { dev: 'john-keells-properties' }]],
  [/excello.*rudra|rudra/i, () => [{ project: 'rudra-wellness-retreat-kalkudah' }, { dev: 'excello-developers' }]],
  [/aathavan/i, () => [{ project: 'aathavan-apartments-dehiwala' }, { dev: 'excello-developers' }]],
  [/excello/i, () => [{ dev: 'excello-developers' }]],
  [/maisonceylon\.com.*1-bedroom/i, () => [{ project: 'villa-sahana' }]],
  [/maisonceylon\.com.*2-bedroom/i, () => [{ project: 'villa-senehasa' }]],
  [/maisonceylon\.com.*3-bedroom/i, () => [{ project: 'villa-samagi' }]],
  [/maisonceylon\.com.*bungalow/i, () => [{ project: 'bungalow-ithiri' }]],
  [/maisonceylon\.com/i, () => [{ dev: 'maison-ceylon' }]],
  [/groundworthgroup/i, () => [{ dev: 'groundworth-group' }]],
  [/jaysonsrealty/i, () => [{ dev: 'jaysons-realty' }]],
  [/ganganilandsales/i, () => [{ dev: 'gangani-land-sales' }]],
  [/vauxhall-dstrct/i, () => [{ project: 'vauxhall-dstrct' }]],
  [/johnkeellsproperties/i, () => [{ dev: 'john-keells-properties' }]],
  [/globalhousing\.lk/i, () => [{ dev: 'global-housing-and-real-estate' }]],
  [/deviconstructions\.lk/i, () => [{ dev: 'devi-constructions' }]],
  [/latitude\.fairwayproperties|fairwayproperties\.lk\/apartments\/latitude/i, () => [{ project: 'fairway-latitude' }, { dev: 'fairway-properties' }]],
  [/fairwayproperties\.lk/i, () => [{ dev: 'fairway-properties' }]],
  [/google\.com\/maps\/place\/Mira/i, () => [{ project: 'mira-weligama' }]],
  [/cpg\.lk/i, () => [{ dev: 'crystal-property-group' }]],
  [/crystal-sands\.com/i, () => [{ project: 'crystal-sands-sky-villas' }, { dev: 'crystal-property-group' }]],
  [/nemra\.lk/i, () => [{ dev: 'nemra' }]],
  [/vyanvillas\.lk/i, () => [{ project: 'vyan-villas-ella' }, { dev: 'provident-capital' }]],
  [/ruresidencieslk\.com/i, () => [{ project: 'ru-residencies-nugegoda' }, { dev: 'ru-isuru-homes' }]],
  [/oceanistapanadura\.com|maps\.app\.goo\.gl\/5VCxv/i, () => [{ project: 'oceanista-panadura' }]],
  [/odiliyahomes\.lk/i, () => [{ dev: 'odiliya-homes' }]],
  [/bayonecolombo\.com|icclk\.com|1CbK0|mLNukQmdNOM|1CbK/i, () => [{ project: "bay-one-residences-colombo" }, { dev: "icc-port-city" }]],
]
const SKIP = /unsplash\.com|pexels\.com|wikimedia|api\.resend|lankanewhomes\.com|localhost/i

const entries: { url: string; label: string; note: string; targets: Target[] }[] = []
const unmatched: string[] = []
memory.forEach((line, idx) => {
  for (const raw of line.match(/https?:\/\/[^\s)>\]|]+/g) ?? []) {
    const url = clean(raw)
    if (SKIP.test(url) || /<[^>]+>/.test(url)) continue
    let targets: Target[] | null = null
    for (const [re, fn] of rules) if (re.test(url)) { targets = fn(url); break }
    if (!targets) { unmatched.push(`L${idx + 1} ${url}`); continue }
    const context = line.slice(0, line.indexOf(raw)).replace(/^[\s\-*]+/, '').replace(/[*_`]/g, '').replace(/[\s:,(—–-]+$/, '').trim().slice(-110)
    const host = new URL(url).hostname.replace(/^www\./, '')
    const label = /\.pdf($|\?)/i.test(url) ? 'Brochure PDF' : /youtu\.?be/.test(url) ? 'Video' : /google\.com\/maps|maps\.app\.goo\.gl/.test(url) ? 'Google Maps pin' : /drive\.google/.test(url) ? 'Brochure (Google Drive)' : `Website: ${host}${new URL(url).pathname.replace(/\/$/, '')}`.slice(0, 70)
    const label2 = label
    entries.push({ url, label: label2, note: context || `owner's links file, line ${idx + 1}`, targets })
  }
})

const MC = 'https://www.maisonceylon.com/villas/off-plan-'
for (const [project, url] of [['villa-senehasa', `${MC}2-bedroom-villa-sri-lanka`], ['villa-samagi', `${MC}3-bedroom-villa-sri-lanka`], ['villa-sahana', `${MC}1-bedroom-villa-sri-lanka`], ['bungalow-ithiri', `${MC}bungalow-sri-lanka`]] as const) {
  entries.push({ url, label: `Website: maisonceylon.com (${project})`, note: 'Maison Ceylon page for this listing, shared by the owner 2026-10-12', targets: [{ project }] })
}
const devs = (await payload.find({ collection: 'developers', limit: 200, depth: 0, pagination: false, select: { slug: true } as never, overrideAccess: true })).docs as any[]
const projects = (await payload.find({ collection: 'projects', limit: 500, depth: 0, pagination: false, select: { slug: true, developer: true } as never, overrideAccess: true })).docs as any[]
const lands = (await payload.find({ collection: 'lands', limit: 1000, depth: 0, pagination: false, select: { slug: true } as never, overrideAccess: true })).docs as any[]
const devBySlug = new Map(devs.map((d) => [d.slug, d.id]))
const projBySlug = new Map(projects.map((p) => [p.slug, p.id]))
const landBySlug = new Map(lands.map((l) => [l.slug, l.id]))

// table -> parentId -> Map(url -> row)
const plan: Record<string, Map<number, Map<string, { label: string; url: string; note: string }>>> = { developers: new Map(), projects: new Map(), lands: new Map() }
const add = (table: string, id: number, e: { label: string; url: string; note: string }) => {
  const m = plan[table].get(id) ?? new Map(); if (!m.has(e.url)) m.set(e.url, e); plan[table].set(id, m)
}
const missing: string[] = []
for (const e of entries) {
  for (const t of e.targets) {
    if (t.project) { const id = projBySlug.get(t.project); id ? add('projects', id, e) : missing.push(`project ${t.project}`) }
    if (t.land) { const id = landBySlug.get(t.land); id ? add('lands', id, e) : missing.push(`land ${t.land}`) }
    if (t.dev) {
      const id = devBySlug.get(t.dev); if (!id) { missing.push(`developer ${t.dev}`); continue }
      add('developers', id, e)
      // developer-level links also go on each of that developer's projects
      if (!t.project) for (const p of projects.filter((p) => p.developer === id)) add('projects', p.id, e)
    }
  }
}
if (process.env.DEBUG) entries.forEach((e) => console.log('E', JSON.stringify(e.label), e.url.slice(0, 70), JSON.stringify(e.targets)))
for (const t of ['developers', 'projects', 'lands']) console.log(t, 'rows touched:', plan[t].size, 'links:', [...plan[t].values()].reduce((n, m) => n + m.size, 0))
console.log('missing targets:', [...new Set(missing)].join(' | ') || 'none')
console.log('unmatched URLs:\n' + unmatched.join('\n'))
if (process.env.APPLY !== '1') { console.log('DRY RUN (set APPLY=1 to write)'); process.exit(0) }

for (const table of ['developers', 'projects', 'lands']) {
  for (const [parentId, links] of plan[table]) {
    const have = (await pool.query(`select url, _order from payload.${table}_reference_links where _parent_id = $1`, [parentId])).rows as { url: string; _order: number }[]
    let order = have.reduce((m, r) => Math.max(m, r._order), 0)
    for (const l of links.values()) {
      if (have.some((h) => h.url === l.url)) continue
      order += 1
      await pool.query(`insert into payload.${table}_reference_links (_order, _parent_id, id, label, url, note) values ($1,$2,$3,$4,$5,$6)`, [order, parentId, crypto.randomBytes(12).toString('hex'), l.label, l.url, l.note])
    }
  }
}
console.log('APPLIED')
process.exit(0)

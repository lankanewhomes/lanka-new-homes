/* eslint-disable @typescript-eslint/no-explicit-any -- merges researched JSON into arbitrary Payload docs */
// Applies a second-pass brochure extraction (out/additions/<slug>.json) to an existing Global Housing listing: floor-plan
// facts, extra Key Features, amenities, nearby places, highlights, a description addendum, contact and other empty
// project fields. Never overwrites a value that is already set (conflicts are logged), never deletes anything.
//
//   GHR_DIR=<scratchpad/gh> NODE_ENV=production npx tsx scripts/apply-ghr-additions.ts <slug> [--dry]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.GHR_DIR ?? ''
const slug = process.argv[2]
const dry = process.argv.includes('--dry')
if (!dir || !slug) throw new Error('Usage: GHR_DIR=… apply-ghr-additions.ts <slug> [--dry]')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: payloadConfig })

const add = JSON.parse(fs.readFileSync(path.join(dir, 'out', 'additions', `${slug}.json`), 'utf8')) as any
const found = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
const doc = found.docs[0] as any
if (!doc) throw new Error(`project not found: ${slug}`)

const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
const log: string[] = []
const data: Record<string, any> = {}

// ---- floor plans
if (add.floorPlanUpdates?.length) {
  const plans = JSON.parse(JSON.stringify(doc.floorPlans ?? [])) as any[]
  let changed = 0
  for (const u of add.floorPlanUpdates) {
    const plan = plans.find((p) => norm(p.planName) === norm(u.planName))
    if (!plan) { log.push(`plan not found: ${u.planName}`); continue }
    for (const [k0, v0] of Object.entries(u.set ?? {})) {
      // Yes/No select fields store 'Yes' / 'No' — never booleans.
      const [k, v] = ['storage', 'utilityArea', 'maidsRoom', 'pantry'].includes(k0) && typeof v0 === 'boolean' ? [k0, v0 ? 'Yes' : 'No'] : [k0, v0]
      if (empty(plan[k]) && empty(plan[`${k}_other`])) { plan[k] = v; changed++ }
      else if (norm(plan[k] ?? plan[`${k}_other`]) !== norm(v)) log.push(`kept existing ${u.planName}.${k}=${plan[k] ?? plan[`${k}_other`]} (brochure: ${v})`)
    }
  }
  if (changed) data.floorPlans = plans
  log.push(`floor plan fields added: ${changed}`)
}

// ---- Key Features
if (add.unitFeaturesAdd?.length) {
  const groups = JSON.parse(JSON.stringify(doc.unitFeatures ?? [])) as any[]
  let n = 0
  for (const a of add.unitFeaturesAdd) {
    const key = ['indoor', 'outdoor', 'specifications'].includes(a.group) ? a.group : null
    let g = groups.find((x) => (key ? x.key === key : norm(x.key_other) === 'general features'))
    if (!g) { g = key ? { key, items: [] } : { key_other: 'General Features', items: [] }; groups.push(g) }
    g.items = g.items ?? []
    const text = a.value_other ?? a.value
    if (g.items.some((i: any) => norm(i.value_other ?? i.value) === norm(text))) continue
    const item: Record<string, any> = {}
    const f = (SO.KEY_FEATURE_FIELD_OPTIONS as string[]).find((o) => norm(o) === norm(a.field))
    if (f) item.field = f; else item.field_other = a.field
    item.value_other = text
    g.items.push(item); n++
  }
  if (n) data.unitFeatures = groups
  log.push(`key features added: ${n}`)
}

// ---- amenities
if (add.amenitiesAdd?.length) {
  const have = new Set<string>((doc.amenities ?? []).map((x: any) => x.name))
  const fresh = (add.amenitiesAdd as string[]).filter((n) => (SO.AMENITY_NAME_OPTIONS as string[]).includes(n) && !have.has(n))
  if (fresh.length) data.amenities = [...(doc.amenities ?? []).map((x: any) => ({ name: x.name })), ...fresh.map((name) => ({ name }))]
  log.push(`amenities added: ${fresh.join(', ') || 'none'}`)
}

// ---- nearby
if (add.nearbyAdd?.length) {
  const nearby = JSON.parse(JSON.stringify(doc.nearby ?? [])) as any[]
  let n = 0
  for (const a of add.nearbyAdd) {
    const key = norm(String(a.name).replace(/\(.*?\)/g, ''))
    if (nearby.some((x) => norm(String(x.name).replace(/\(.*?\)/g, '')) === key)) continue
    nearby.push({ category: a.category, name: a.name, ...(a.distanceKm != null ? { distanceKm: a.distanceKm } : {}) }); n++
  }
  if (n) data.nearby = nearby
  log.push(`nearby added: ${n}`)
}

// ---- highlights (field is meant to hold 3–5 points)
if (add.highlightsAdd?.length) {
  const have: string[] = doc.highlights ?? []
  const fresh = (add.highlightsAdd as string[]).filter((h) => !have.some((x) => norm(x) === norm(h))).slice(0, Math.max(0, 5 - have.length))
  if (fresh.length) data.highlights = [...have, ...fresh]
  log.push(`highlights added: ${fresh.length}`)
}

// ---- description addendum
if (add.descriptionAddendum && !String(doc.description ?? '').includes(add.descriptionAddendum)) {
  data.description = `${doc.description ?? ''}${doc.description ? '\n\n' : ''}${add.descriptionAddendum}`
  log.push('description addendum added')
}

// ---- contact (only empty values)
if (add.contact) {
  const c = { ...(doc.contact ?? {}) }
  let n = 0
  for (const k of ['name', 'email', 'phone']) if (add.contact[k] && empty(c[k])) { c[k] = add.contact[k]; n++ }
  if (n) data.contact = c
  log.push(`contact fields added: ${n}${add.contact.office ? ` (office as printed: ${add.contact.office} — not stored, no field)` : ''}`)
}

// ---- other project fields (only when unset)
for (const [k, v] of Object.entries(add.projectFields ?? {})) {
  if (empty(doc[k]) && empty(doc[`${k}_other`])) { data[k] = v; log.push(`project field set: ${k}`) }
  else if (norm(doc[k] ?? doc[`${k}_other`]) !== norm(v)) log.push(`kept existing ${k}=${doc[k] ?? doc[`${k}_other`]} (brochure: ${v})`)
}
if (add.paymentPlan) log.push(`PAYMENT PLAN present in additions — review manually: ${JSON.stringify(add.paymentPlan).slice(0, 200)}`)

console.log(`[${slug}]`, log.join('\n  '))
if (dry || !Object.keys(data).length) { console.log(dry ? '(dry run — nothing written)' : '(nothing to write)'); process.exit(0) }

// Write; if the CMS rejects a select value, move it to its "(Other)" sibling (or drop just that field) and retry.
for (let attempt = 0; attempt < 8; attempt++) {
  try {
    await payload.update({ collection: 'projects', id: doc.id, data: data as never, overrideAccess: true })
    console.log('updated', slug, Object.keys(data).join(', '))
    process.exit(0)
  } catch (e) {
    const errs = ((e as { data?: { errors?: { path?: string; message?: string }[] } }).data?.errors) ?? []
    if (!errs.length) throw e
    for (const er of errs) {
      const m = /^(floorPlans|nearby|unitFeatures)\.(\d+)\.(?:items\.(\d+)\.)?(\w+)$/.exec(er.path ?? '')
      if (!m) { console.log('  cannot fix', er.path, er.message); delete data[(er.path ?? '').split('.')[0]]; continue }
      const [, arr, i, j, field] = m
      const row = j !== undefined ? data[arr]?.[+i]?.items?.[+j] : data[arr]?.[+i]
      if (!row) continue
      if (row[field] !== undefined) { row[`${field}_other`] = row[`${field}_other`] ?? row[field]; delete row[field]; console.log('  moved to Other:', er.path) }
    }
  }
}
throw new Error('could not write after retries')

/* eslint-disable @typescript-eslint/no-explicit-any -- these one-off scripts read arbitrary researched JSON */
// Imports the Global Housing & Real Estate (GHR Global) developer profile (with its awards) and the ongoing project
// listings researched into JSON files (out/developer.json and out/<slug>.json, same format as import-jkp.ts).
//
//   GHR_DIR=<scratchpad/gh> NODE_ENV=production npx tsx scripts/import-ghr.ts developer
//   GHR_DIR=<scratchpad/gh> NODE_ENV=production npx tsx scripts/import-ghr.ts listing edmonton-bliss-residencies [--publish]
//
// A listing JSON uses "R2:<key>" placeholders wherever an image/brochure URL belongs
// plus an `assets` array of { localFile, r2Key }; this script uploads every asset to
// the media bucket (never hot-links the developer's site) and swaps the placeholders
// for the real https://media.lankanewhomes.com/... URLs, then creates the record.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.GHR_DIR ?? ''
if (!dir) throw new Error('Set GHR_DIR')
const [mode, slug] = process.argv.slice(2)
const publish = process.argv.includes('--publish')

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const { mirrorToR2, isMirrorConfigured } = await import('../src/lib/listing-import/mirror')
if (!isMirrorConfigured()) throw new Error('R2 env not configured')
const payload = await getPayload({ config: payloadConfig })

const MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
}
const DEV_SLUG = process.env.DEV_SLUG ?? 'global-housing-and-real-estate'

type DevAward = { title: string; issuer?: string | null; year?: string | number | null; description?: string | null; url?: string | null; imageFile?: string | null }
type DevJson = {
  slug?: string; name: string; description?: string; website?: string; location?: string; establishedYear?: number | null; yearsInBusiness?: number | null
  activeProjects?: number | null; completedProjects?: number | null; contact_phone?: string; contact_email?: string; email?: string
  socialLinks?: Record<string, string | null>; awards?: DevAward[]; logoFile?: string | null
}
const extOf = (f: string) => path.extname(f).slice(1).toLowerCase()

async function ensureDeveloper(): Promise<{ id: number }> {
  const found = await payload.find({ collection: 'developers', where: { slug: { equals: DEV_SLUG } }, limit: 1, overrideAccess: true })
  if (found.docs[0]) return found.docs[0] as unknown as { id: number }
  const dj = JSON.parse(fs.readFileSync(path.join(dir, 'out', 'developer.json'), 'utf8')) as DevJson
  let logo: string | undefined
  if (dj.logoFile && fs.existsSync(dj.logoFile)) {
    const ext = extOf(dj.logoFile)
    logo = await mirrorToR2(`logos/developers/${DEV_SLUG}-logo.${ext}`, fs.readFileSync(dj.logoFile), MIME[ext] ?? 'application/octet-stream')
  }
  const awards: Record<string, unknown>[] = []
  for (const a of dj.awards ?? []) {
    let imageUrl: string | undefined
    if (a.imageFile && fs.existsSync(a.imageFile)) {
      const ext = extOf(a.imageFile)
      const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
      imageUrl = await mirrorToR2(`awards/${DEV_SLUG}/${DEV_SLUG}_${slug}${a.year ? `-${a.year}` : ''}.${ext}`, fs.readFileSync(a.imageFile), MIME[ext] ?? 'application/octet-stream')
    }
    awards.push({ title: a.title, ...(a.issuer ? { issuer: a.issuer } : {}), ...(a.year ? { year: String(a.year) } : {}), ...(a.description ? { description: a.description } : {}), ...(imageUrl ? { imageUrl } : {}), ...(a.url ? { url: a.url } : {}) })
  }
  const sl = dj.socialLinks ?? {}
  const created = await payload.create({
    collection: 'developers',
    data: {
      slug: DEV_SLUG,
      name: dj.name,
      ...(logo ? { logo } : {}),
      ...(dj.description ? { description: dj.description } : {}),
      ...(dj.website ? { website: dj.website } : {}),
      ...(dj.location ? { location: dj.location } : {}),
      ...(dj.establishedYear ? { establishedYear: dj.establishedYear } : {}),
      ...(dj.yearsInBusiness ? { yearsInBusiness: dj.yearsInBusiness } : {}),
      ...(dj.activeProjects != null ? { activeProjects: dj.activeProjects } : {}),
      ...(dj.completedProjects != null ? { completedProjects: dj.completedProjects } : {}),
      ...(dj.contact_phone ? { contact_phone: dj.contact_phone } : {}),
      ...((dj.contact_email ?? dj.email) ? { contact_email: dj.contact_email ?? dj.email } : {}),
      socialLinks: Object.fromEntries(Object.entries(sl).filter(([, v]) => Boolean(v))),
      ...(awards.length ? { awards } : {}),
    } as never,
    overrideAccess: true,
  })
  console.log('Developer created', created.id, `(${awards.length} awards)`)
  return created as unknown as { id: number }
}

if (mode === 'developer') {
  await ensureDeveloper()
  process.exit(0)
}

if (!['listing', 'patch'].includes(mode) || !slug) throw new Error('Usage: developer | listing <slug> [--publish] | patch <slug>')

const file = path.join(dir, 'out', `${slug}.json`)
const rec = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, any>
const kind = rec.kind as 'project' | 'land'
const dev = await ensureDeveloper()

// ---- upload assets, build placeholder -> URL map
const urlByKey = new Map<string, string>()
for (const a of (rec.assets ?? []) as { localFile: string; r2Key: string }[]) {
  const ext = a.r2Key.split('.').pop()!.toLowerCase()
  if (!fs.existsSync(a.localFile)) { console.log('  missing asset file', a.localFile); continue }
  let body = fs.readFileSync(a.localFile)
  // Source renders can be tens of MB — downscale big raster images (max 2600px, JPEG q85) before upload.
  if (body.length > 4 * 1024 * 1024 && (ext === 'jpg' || ext === 'jpeg')) {
    const tmp = path.join(os.tmpdir(), `jkp-${path.basename(a.r2Key)}`)
    execFileSync('sips', ['-Z', '2600', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', a.localFile, '--out', tmp], { stdio: 'ignore' })
    body = fs.readFileSync(tmp)
    console.log('  downscaled', path.basename(a.r2Key), `-> ${(body.length / 1048576).toFixed(1)} MB`)
  }
  urlByKey.set(a.r2Key, await mirrorToR2(a.r2Key, body, MIME[ext] ?? 'application/octet-stream'))
}
const swap = (v: unknown): unknown => {
  if (typeof v === 'string' && v.startsWith('R2:')) {
    const url = urlByKey.get(v.slice(3))
    if (!url) console.log('  UNRESOLVED placeholder', v)
    return url ?? undefined
  }
  if (Array.isArray(v)) return v.map(swap)
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, swap(x)]))
  return v
}
const data = swap(rec) as Record<string, any>
delete data.assets
delete data.kind
// research-only annotations that aren't part of the schema
for (const k of ['plotGroups_note', 'sourceUrl', 'notes', '_notes']) delete data[k]

if (kind === 'project') {
  data.developer = dev.id
  delete data.developerSlug
  if (data.neighborhoodSlug) {
    const n = await payload.find({ collection: 'neighborhoods', where: { slug: { equals: data.neighborhoodSlug } }, limit: 1, overrideAccess: true })
    if (n.docs[0]) data.neighborhood = (n.docs[0] as unknown as { id: number }).id
    else console.log('  WARNING: neighbourhood not found', data.neighborhoodSlug)
  }
  data.isPublished = publish
} else {
  data.sellerType = 'developer'
  data.seller = { relationTo: 'developers', value: dev.id }
  delete data.sellerSlug
}

const { AMENITY_NAME_OPTIONS } = await import('../src/collections/shared-fields')
if (Array.isArray(data.amenities)) {
  const allowed = new Set(AMENITY_NAME_OPTIONS as string[])
  const dropped = data.amenities.filter((a: { name: string }) => !allowed.has(a.name)).map((a: { name: string }) => a.name)
  if (dropped.length) console.log('  amenities not in our vocabulary (dropped from amenities[], keep in text):', dropped.join(', '))
  data.amenities = data.amenities.filter((a: { name: string }) => allowed.has(a.name))
}
// Project/land "nearby" categories are a fixed list (no Business/Access) — map anything else to Landmark.
if (Array.isArray(data.nearby)) {
  const ok = new Set(['School', 'Hospital', 'Shopping', 'Restaurant', 'Transport', 'Landmark'])
  data.nearby = data.nearby.map((n: { category: string }) => (ok.has(n.category) ? n : { ...n, category: 'Landmark' }))
}
// Select-with-other fields (Payload `x` + `x_other`): a value that is not one of the fixed options must go in `x_other`,
// otherwise validation rejects it and the retry below would drop the whole field (this lost Key Features and city on the
// first Global Housing batch). Works on the project body and on every Key Feature item.
const SO = await import('../src/collections/shared-fields')
const norm1 = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
function soField(obj: Record<string, any>, name: string, options: string[]) {
  const v = obj[name]
  if (typeof v !== 'string' || !v) return
  const hit = options.find((o) => norm1(o) === norm1(v))
  if (hit) { obj[name] = hit; return }
  obj[`${name}_other`] = obj[`${name}_other`] ?? v
  delete obj[name]
}
function normalizeSelects(d: Record<string, any>) {
  soField(d, 'type', (SO as any).PROJECT_TYPE_OPTIONS)
  soField(d, 'city', (SO as any).CITY_OPTIONS)
  soField(d, 'district', (SO as any).DISTRICT_OPTIONS)
  soField(d, 'province', (SO as any).PROVINCE_OPTIONS)
  soField(d, 'constructionStatus', (SO as any).CONSTRUCTION_STATUS_OPTIONS)
  soField(d, 'security', (SO as any).SECURITY_OPTIONS)
  for (const group of (d.unitFeatures ?? []) as { items?: Record<string, any>[] }[]) {
    for (const item of group.items ?? []) {
      soField(item, 'field', (SO as any).KEY_FEATURE_FIELD_OPTIONS)
      soField(item, 'value', (SO as any).KEY_FEATURE_VALUE_OPTIONS)
      if (item.value === null) delete item.value
    }
  }
}

// A floor plan's price is a required field: when the developer publishes none, store 0 ("Contact for pricing") — never a
// guessed or borrowed figure — so the validation retry below can't drop the whole floorPlans list.
if (Array.isArray(data.floorPlans)) {
  for (const plan of data.floorPlans as { startingPriceLkr?: number | null }[]) {
    if (typeof plan.startingPriceLkr !== 'number') plan.startingPriceLkr = 0
  }
}
normalizeSelects(data)
const coll = kind === 'project' ? 'projects' : 'lands'
// patch: re-apply the select-with-other / Key Feature / neighbourhood fields on an already-created project.
if (process.argv[2] === 'patch') {
  const cur = await payload.find({ collection: coll, where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
  const doc = cur.docs[0] as unknown as { id: number } | undefined
  if (!doc) { console.log('not found', data.slug); process.exit(0) }
  const keys = ['type', 'type_other', 'city', 'city_other', 'district', 'district_other', 'province', 'province_other', 'constructionStatus', 'constructionStatus_other', 'security', 'security_other', 'unitFeatures', 'neighborhood']
  const patchData: Record<string, unknown> = {}
  for (const k of keys) if (data[k] !== undefined) patchData[k] = data[k]
  await payload.update({ collection: coll, id: doc.id, data: patchData as never, overrideAccess: true })
  console.log('patched', data.slug, Object.keys(patchData).join(', '))
  process.exit(0)
}
const exists = await payload.find({ collection: coll, where: { slug: { equals: data.slug } }, limit: 1, overrideAccess: true })
if (exists.docs[0]) { console.log('exists', data.slug); process.exit(0) }
// Create; if the CMS rejects specific fields (e.g. a badge outside its option list), drop just those
// fields, say so, and retry — nothing is silently lost.
let created: { slug?: string } | undefined
for (let attempt = 0; attempt < 5 && !created; attempt++) {
  try {
    created = await payload.create({ collection: coll, data: data as never, overrideAccess: true })
  } catch (e) {
    const errs = ((e as { data?: { errors?: { path?: string; message?: string }[] } }).data?.errors) ?? []
    const bad = [...new Set(errs.map((x) => (x.path ?? '').split('.')[0]).filter(Boolean))]
    if (!bad.length) throw e
    console.log('  VALIDATION: dropping fields', bad.join(', '), '—', errs.map((x) => `${x.path}: ${x.message}`).join(' | ').slice(0, 300))
    for (const f of bad) delete data[f]
  }
}
console.log('created', coll, created?.slug, kind === 'project' ? (publish ? '(published)' : '(unpublished)') : '')
process.exit(0)

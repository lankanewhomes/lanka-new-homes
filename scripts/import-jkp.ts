/* eslint-disable @typescript-eslint/no-explicit-any -- these one-off scripts read arbitrary researched JSON */
// Imports the John Keells Properties listings researched into JSON files
// (one per listing; see the "kind" field: "project" or "land").
//
//   JKP_DIR=<scratchpad/jkp> NODE_ENV=production npx tsx scripts/import-jkp.ts developer
//   JKP_DIR=<scratchpad/jkp> NODE_ENV=production npx tsx scripts/import-jkp.ts listing vauxhall-dstrct [--publish]
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
const dir = process.env.JKP_DIR ?? ''
if (!dir) throw new Error('Set JKP_DIR')
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
const DEV_SLUG = 'john-keells-properties'

async function ensureDeveloper(): Promise<{ id: number }> {
  const found = await payload.find({ collection: 'developers', where: { slug: { equals: DEV_SLUG } }, limit: 1, overrideAccess: true })
  if (found.docs[0]) return found.docs[0] as unknown as { id: number }
  const logo = await mirrorToR2('logos/developers/john-keells-properties-logo.png', fs.readFileSync(path.join(dir, 'sitelogo-dark.png')), 'image/png')
  const created = await payload.create({
    collection: 'developers',
    data: {
      slug: DEV_SLUG,
      name: 'John Keells Properties',
      logo,
      description:
        "John Keells Properties is the real estate arm of the John Keells Group, Sri Lanka's largest conglomerate. Established in 2003, it develops luxury city apartments and suburban communities across Sri Lanka, with landmark projects including The Monarch, The Emperor, OnThree20, Cinnamon Life, TRI-ZEN and VIMAN, and manages properties including Crescat Boulevard and Victoria Golf Resort.",
      website: 'https://www.johnkeellsproperties.com',
      location: 'Colombo',
      establishedYear: 2003,
      yearsInBusiness: 23,
      contact_phone: '+94112152100',
      socialLinks: {
        facebook: 'https://www.facebook.com/johnkeellsproperties/',
        instagram: 'https://www.instagram.com/johnkeells_properties/',
        linkedin: 'https://www.linkedin.com/company/john-keells-properties/',
        youtube: 'https://www.youtube.com/@johnkeellsproperties',
      },
    } as never,
    overrideAccess: true,
  })
  console.log('Developer created', created.id)
  return created as unknown as { id: number }
}

if (mode === 'developer') {
  await ensureDeveloper()
  process.exit(0)
}

if (mode !== 'listing' || !slug) throw new Error('Usage: developer | listing <slug> [--publish]')

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
const coll = kind === 'project' ? 'projects' : 'lands'
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

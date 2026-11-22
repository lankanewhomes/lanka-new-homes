/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner request 2026-11-22: Maison Ceylon listings should have videos; also check amenities and key features.
// Source: the developer's own villa pages (maisonceylon.com/villas/...). Add-only and idempotent: nothing existing is changed or removed.
//  - Videos: the 3D floor-plan walkthroughs published for Villa Sahana (1 bed) and Villa Senehasa (2 bed). None is published for Villa Samagi or Bungalow Ithiri.
//  - Amenities / Key Features: only what each page states.
//   MC_DIR=<folder with the 2 mp4 + p1.webp, p2.webp> NODE_ENV=production npx tsx scripts/update-maison-ceylon-videos-features-2026-11-22.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const dir = process.env.MC_DIR ?? '/tmp/mc'
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
type KF = [string, [string, string][]]
const GLASS = 'Floor-to-ceiling glass between the lounge and the tropical garden'
const SUP: KF = ['building-structure', [['Supervision', 'On-the-ground site supervision, with standards and materials checked at every stage']]]
const PLAN: Record<number, { video?: [string, string, string]; amenities: [string, string][]; kf: KF[] }> = {
  43: {
    video: ['villa-1-bedroom-sri-lanka-floor-plan-walkthrough.mp4', 'p1.webp', '3D walkthrough of the 1-bedroom villa floor plan'],
    amenities: [['Garden', 'Landscaped tropical garden with native planting and coconut palms.']],
    kf: [['interior', [['Doors & Windows', GLASS], ['Kitchen', 'Fitted kitchen'], ['Bedroom', '1 en-suite bedroom']]], SUP],
  },
  44: {
    video: ['villa-2-bedroom-sri-lanka-floor-plan-walkthrough.mp4', 'p2.webp', '3D walkthrough of the 2-bedroom villa floor plan'],
    amenities: [['Pool', 'Private pool (3.5 x 10 m lap) with a timber deck'], ['Garden', 'Landscaped tropical garden with native planting and coconut palms.']],
    kf: [['general-features', [['Furnishing', 'Fully furnished, designer finishes'], ['Climate', 'Air conditioning']]], ['outdoor', [['Outdoor', 'Landscaped tropical garden']]]],
  },
  45: {
    amenities: [['Garden', 'Landscaped tropical garden with native planting and coconut palms.']],
    kf: [['interior', [['Doors & Windows', GLASS], ['Kitchen', 'Fitted kitchen'], ['Bedrooms', '3 en-suite bedrooms, each with its own bathroom']]], SUP],
  },
  105: {
    amenities: [],
    kf: [
      ['general-features', [['Furnishing', 'Designer furniture and finishes, delivered turnkey'], ['Climate', 'Air conditioning and hot water']]],
      ['interior', [['Layout', 'Open studio with sleeping and living area'], ['Kitchen', 'Fitted kitchenette'], ['Bathroom', 'Private shower room']]],
      ['outdoor', [['Outdoor', 'Private terrace']]],
      ['building-structure', [['Structure', 'Standalone building on your plot']]],
    ],
  },
}
for (const [idStr, plan] of Object.entries(PLAN)) {
  const id = Number(idStr)
  const p: any = await payload.findByID({ collection: 'projects', id, depth: 0, overrideAccess: true })
  const data: Record<string, any> = {}
  const log: string[] = []
  if (plan.video && !(p.videos ?? []).some((v: any) => String(v.embedUrl).includes('walkthrough'))) {
    const [file, poster, label] = plan.video
    const base = `projects/${p.slug}/videos/${p.slug}_floor-plan-walkthrough`
    const embedUrl = apply ? await mirrorToR2(`${base}.mp4`, fs.readFileSync(path.join(dir, file)), 'video/mp4') : '(would upload mp4)'
    const thumbnail = apply ? await mirrorToR2(`${base}-poster.webp`, fs.readFileSync(path.join(dir, poster)), 'image/webp') : '(would upload poster)'
    data.videos = [...(p.videos ?? []).map((v: any) => ({ label: v.label, embedUrl: v.embedUrl, thumbnail: v.thumbnail })), { label, embedUrl, thumbnail }]
    log.push('video +1')
  }
  const haveAm = new Set((p.amenities ?? []).map((a: any) => a.name))
  const newAm = plan.amenities.filter(([n]) => !haveAm.has(n))
  if (newAm.length) { data.amenities = [...(p.amenities ?? []).map((a: any) => ({ name: a.name, description: a.description })), ...newAm.map(([name, description]) => ({ name, description }))]; log.push('amenities +' + newAm.map((a) => a[0]).join(',')) }
  const groups = (p.unitFeatures ?? []).map((g: any) => ({ key: g.key, key_other: g.key_other, label: g.label, items: (g.items ?? []).map((i: any) => ({ field: i.field, field_other: i.field_other, value: i.value, value_other: i.value_other })) }))
  let kfChanged = false
  for (const [key, items] of plan.kf) {
    let g = groups.find((x: any) => x.key === key)
    if (!g) { g = { key, items: [] }; groups.push(g) }
    for (const [field, value] of items) {
      if (g.items.some((i: any) => (i.field || i.field_other) === field)) continue
      g.items.push({ field_other: field, value_other: value }); kfChanged = true; log.push(`KF ${key}: ${field}`)
    }
  }
  if (kfChanged) data.unitFeatures = groups
  console.log(id, p.name, '->', log.join(' | ') || 'nothing to add')
  if (apply && Object.keys(data).length) {
    await payload.update({ collection: 'projects', id, data: data as never, overrideAccess: true })
    const a: any = await payload.findByID({ collection: 'projects', id, depth: 0, overrideAccess: true })
    console.log('   saved: videos', a.videos?.length, 'amenities', a.amenities?.length, 'KF groups', a.unitFeatures?.length, 'gallery', a.gallery?.length, 'plans', a.floorPlans?.length)
  }
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)

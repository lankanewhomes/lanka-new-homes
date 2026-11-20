/* eslint-disable @typescript-eslint/no-explicit-any */
// Marina Square: replaces the 29 per-unit-code placeholder rows with one row per developer design (owner, 2026-11-09).
// Source: the developer's own condo-types pages, Wayback snapshot 2022-12-06 (sizes, bedrooms, bathrooms, views, maid's room, car park, 2D + 3D plan images; the
// blueprints state the total area in sq ft and sq m). The current developer site only lists 4 D/E and 4 F/G, so every other design is marked Sold Out
// (1 A/B to 2 A/B/C/D were explicitly "SOLD OUT" in the snapshot; the rest have no price now). 2022 prices are NOT entered (outdated).
//   MS_DIR=<folder with designs.json + dimg/> NODE_ENV=production npx tsx scripts/update-marina-square-floor-plans-from-developer.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.MS_DIR ?? ''
if (!dir) throw new Error('Set MS_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const SLUG = process.env.MS_SLUG ?? 'marina-square-uptown-colombo'
const p: any = (await payload.find({ collection: 'projects' as never, where: { slug: { equals: SLUG } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0]
const designs: any[] = JSON.parse(fs.readFileSync(path.join(dir, 'designs.json'), 'utf8'))
const keepPenthouses = (p.floorPlans ?? []).filter((x: any) => /^4 [DF]\//.test(String(x.planName)))
if (keepPenthouses.length !== 2) throw new Error('expected the two penthouse rows, got ' + keepPenthouses.length)
const pdf = p.brochureUrl as string
const num = (s: string) => Number(s.replace(/,/g, ''))
const towers = (t: string) => 'Towers ' + t.replace(/^Towers?\s*/i, '').replace(/\s*,\s*/g, ', ').replace(/J ,P/, 'J, P')
const order = ['3 P-TR Q-TR', '3 A', '3 B', '3 C', '3 F/G/H/J', '3 R', '2.5 P-TR Q-TR', '2 P-TR Q-TR', '2 L/M', '2 F/G', '2 H/J', '2 S', '2 T', '2 A/B/C/D', '1.5 A/B/C/D', '1 E', '1 A/B', '1 C/D']
const rows: any[] = []
for (const code of order) {
  const d = designs.find((x) => x.code === code)
  if (!d) throw new Error('missing design ' + code)
  const [bedLine] = d.feat.filter((f: string) => /Bedroom/.test(f))
  const [, bedsS, sqftS, bathsS] = bedLine.match(/^([\d.]+) Bedrooms? \| ([\d,]+) Sq\.?[Ff]t \| (\d+) Bathrooms?$/) ?? []
  if (!bedsS) throw new Error('cannot parse ' + bedLine)
  const [lvl, tw] = d.head.split('|').slice(1).map((s: string) => s.trim())
  const floors = lvl.replace(/^Level\s*/i, '').replace(/\s*-\s*/, '-').replace(/\s*&\s*/, ' and ')
  const viewText = (d.feat.find((f: string) => /View/.test(f)) as string).replace(/ City & City/, '')
  const terrace = /Terrace/.test(d.head)
  const slugCode = code.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/\./g, '-').replace(/^-|-$/g, '')
  const img3d = await mirrorToR2(`projects/marina-square-colombo-15/floor-plans/marina-square-colombo-15_${slugCode}_3d.jpg`, fs.readFileSync(path.join(dir, 'dimg', path.basename(d.imgs[0]))), 'image/jpeg')
  const img2d = await mirrorToR2(`projects/marina-square-colombo-15/floor-plans/marina-square-colombo-15_${slugCode}.jpg`, fs.readFileSync(path.join(dir, 'dimg', path.basename(d.imgs[1]))), 'image/jpeg')
  const row: any = {
    planName: `${code} - ${bedsS} Bedroom${terrace ? ' Duplex with Private Garden' : ''}`, bedrooms: Number(bedsS), bathrooms: Number(bathsS), floorAreaSqFt: num(sqftS), startingPriceLkr: 0,
    floorRange: `${floors} (${towers(tw)})`, availability: 'Sold Out', unitsAvailable: 0, parkingSpaces: 1, image: img2d, image3d: img3d,
    planDocuments: [{ label: 'Typical floor plans (PDF)', url: pdf }],
  }
  if (/^Harbour \/ Sea View$/.test(viewText)) row.view = 'Sea View'; else row.view_other = viewText
  if (d.feat.some((f: string) => /Maids Room/.test(f))) row.maidsRoom = 'Yes'
  if (d.feat.some((f: string) => /Pantry/.test(f))) row.pantry = 'Yes'
  if (terrace) row.outdoorSpace = 'Private Garden'
  rows.push(row)
}
const r: any = await payload.update({ collection: 'projects' as never, id: p.id, overrideAccess: true, data: { floorPlans: [...keepPenthouses, ...rows] } as never })
const fp = r.floorPlans
console.log('floor plans', fp.length, '| Sold Out', fp.filter((x: any) => x.availability === 'Sold Out').length, '| Available', fp.filter((x: any) => x.availability === 'Available').length, '| 3d on penthouse', !!fp[0].image3d, '| gallery', r.gallery?.length, 'amenities', r.amenities?.length, 'blockplans', r.blockPlanImages?.length)
console.log(fp.slice(2).map((x: any) => `${x.planName} ${x.floorAreaSqFt}sf ${x.bathrooms}ba ${x.floorRange} ${x.view ?? x.view_other}`).join('\n'))
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner, 2026-11-28: "make sure you create the floor plans listing page for each listings" (the 5 UDA drafts, projects 191-195, unpublished).
// Each floor plan row gets its own page at /projects/<slug>/floor-plans/<plan>, so every draft needs one row per unit type with its drawing.
// The UDA site's image folders (open directory listings, read 2026-11-28) hold files its pages do not show:
//   Green Arcade: its own Unit 01/02/03 plan drawings (the same three layouts as Viyathpura's) and photos 7 and 8
//   Transhub:     the four plans with room dimensions (TYPE-xx_dim.jpg) and a second aerial view
//   Viyathpura:   eight large exterior renders
// Changes: Green Arcade gets Types A, B, C with drawings (replacing the two rows that had none); Transhub plans switch to the dimensioned
// drawings; Harbour View's single combined row becomes three (Types A and B, C, D), each with its own crop of the UDA unit drawing;
// 3-bedroom plans at Viyathpura and Green Arcade carry the UDA's published "from" price. Crescendo already has six plans with drawings.
// Idempotent. Dry run by default.
//   UDA_DIR=<folder with img/ and img2/> NODE_ENV=production npx tsx scripts/update-uda-floor-plans-2026-11-28.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const dir = process.env.UDA_DIR ?? ''
if (!dir) throw new Error('Set UDA_DIR')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const sharp = (await import('sharp')).default
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const payload = await getPayload({ config: cfg })
const kebab = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const M = 1_000_000
const up = async (slug: string, sub: string, label: string, file: string, v = '') => {
  const full = path.join(dir, file); if (!fs.existsSync(full)) throw new Error('missing ' + full)
  if (!apply) return `(would upload ${file})`
  return mirrorToR2(`projects/${slug}/${sub}/${slug}_${kebab(label)}${v}.jpg`, await sharp(full).resize({ width: 2400, withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer(), 'image/jpeg')
}
const keepPlan = (f: any) => { const { id: _id, ...rest } = f; return rest }
const load = async (id: number, slug: string) => { const p: any = await payload.findByID({ collection: 'projects', id, depth: 0, overrideAccess: true }); if (p.slug !== slug) throw new Error('unexpected project ' + id); if (p.isPublished) throw new Error('published, stop: ' + slug); return p }
const save = async (p: any, data: Record<string, any>, log: string[]) => {
  console.log(p.id, p.name, '->', log.join(' | ') || 'nothing to change')
  if (!apply || !Object.keys(data).length) return
  await payload.update({ collection: 'projects', id: p.id, data: data as never, overrideAccess: true })
  const a: any = await payload.findByID({ collection: 'projects', id: p.id, depth: 0, overrideAccess: true })
  console.log('   saved: plans', a.floorPlans.map((f: any) => `${f.planName}${f.image ? '' : ' [NO DRAWING]'}`).join('; '), '| gallery', a.gallery?.length, '| amenities', a.amenities?.length, '| published', a.isPublished)
}
const addGallery = async (p: any, items: [string, string][], data: Record<string, any>, log: string[]) => {
  const gallery = (p.gallery ?? []).map((g: any) => ({ label: g.label, image: g.image }))
  let n = 0
  for (const [file, label] of items) { if (gallery.some((g: any) => g.label === label)) continue; gallery.push({ label, image: await up(p.slug, 'gallery', label, file) }); n++ }
  if (n) { data.gallery = gallery; log.push(`gallery +${n}`) }
}
const todoNote = async (projectId: number, note: string) => {
  const t: any = (await payload.find({ collection: 'listing-todos', where: { project: { equals: projectId } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!t || String(t.notes ?? '').includes(note.slice(0, 40))) return
  if (apply) await payload.update({ collection: 'listing-todos', id: t.id, data: { notes: `${t.notes ?? ''}\n\nUpdate 2026-11-28: ${note}` } as never, overrideAccess: true })
}

// 191 Viyathpura: "from" price on the two 3-bedroom types, 5 more exterior renders.
{
  const p = await load(191, 'viyathpura-pannipitiya'); const data: Record<string, any> = {}; const log: string[] = []
  if (p.floorPlans.some((f: any) => f.bedrooms === 3 && !f.startingPriceLkr)) { data.floorPlans = p.floorPlans.map((f: any) => ({ ...keepPlan(f), ...(f.bedrooms === 3 && !f.startingPriceLkr ? { startingPriceLkr: 20 * M } : {}) })); log.push('3-bedroom plans: from Rs 20M') }
  await addGallery(p, [['img2/viyathpura__Exterior_03.jpg', 'Lawn and tower blocks'], ['img2/viyathpura__Exterior_04.jpg', 'Driveway and shops'], ['img2/viyathpura__Exterior_06.jpg', 'Pool and tower blocks'], ['img2/viyathpura__Exterior_07.jpg', 'Rooftop garden'], ['img2/viyathpura__Exterior_01.jpg', 'Looking up a tower']], data, log)
  await save(p, data, log)
  await todoNote(191, 'Types A and B now show the UDA "3 bedroom from Rs 20 million" figure as their from-price; the exact price of each type is not published. Five exterior renders added from the UDA image folder.')
}

// 192 Green Arcade: three typed plans with the drawings from Green Arcade's own image folder.
{
  const p = await load(192, 'green-arcade-residencies-kottawa'); const data: Record<string, any> = {}; const log: string[] = []
  if (!p.floorPlans.some((f: any) => /^Type A/.test(f.planName))) {
    const base = { availability: 'Available' }
    data.floorPlans = [
      { ...base, planName: 'Type A - 3 Bedroom', bedrooms: 3, bathrooms: 3, floorAreaSqFt: 0, startingPriceLkr: 22.5 * M, image: await up(p.slug, 'floor-plans', 'Type A - 3 Bedroom', 'img2/green_arcade__Unit_01_01_Plan.jpg') },
      { ...base, planName: 'Type B - 3 Bedroom', bedrooms: 3, bathrooms: 2, floorAreaSqFt: 0, startingPriceLkr: 22.5 * M, image: await up(p.slug, 'floor-plans', 'Type B - 3 Bedroom', 'img2/green_arcade__Unit_02_01_Plan.jpg') },
      { ...base, planName: 'Type C - 2 Bedroom', bedrooms: 2, bathrooms: 2, floorAreaSqFt: 750, startingPriceLkr: 17.77 * M, image: await up(p.slug, 'floor-plans', 'Type C - 2 Bedroom', 'img2/green_arcade__Unit_03_01_Plan.jpg') },
    ]
    log.push('plans: 2 rows without drawings -> Types A, B, C with drawings')
  }
  await addGallery(p, [['img2/green_arcade__01_Photo_-_7.jpg', 'Pool and tower blocks'], ['img2/green_arcade__01_Photo_-_8.jpg', 'Central lawn']], data, log)
  await save(p, data, log)
  await todoNote(192, 'Floor plans replaced: the UDA image folder for Green Arcade holds its own Unit 01, 02 and 03 drawings, now Types A, B and C. They are the same three layouts the UDA shows for Viyathpura; confirm with the UDA that Green Arcade really uses them. 3-bedroom sizes per type are not published (950 to 1,050 sq ft); both 3-bedroom types carry the "from Rs 22.5 million" figure. The price panel says 2 bathrooms for 3-bedroom units but the Type A drawing shows 3; entered as drawn.')
}

// 194 Transhub: the dimensioned drawings, plus the second aerial view.
{
  const p = await load(194, 'transhub-residencies-makumbura'); const data: Record<string, any> = {}; const log: string[] = []
  if (!p.floorPlans.some((f: any) => String(f.image).includes('-dimensions'))) {
    const plans: any[] = []
    for (const f of p.floorPlans) { const code = /Type (\d[AB])/.exec(f.planName)?.[1]; if (!code) throw new Error('unexpected plan ' + f.planName); plans.push({ ...keepPlan(f), image: await up(p.slug, 'floor-plans', f.planName, `img2/transhub__TYPE-${code}_dim.jpg`, '-dimensions') }) }
    data.floorPlans = plans; log.push('4 plan drawings -> versions with room dimensions')
  }
  await addGallery(p, [['img2/transhub__Aerial_View_2_A_small_file.jpg', 'Aerial view with the canal']], data, log)
  await save(p, data, log)
  await todoNote(194, 'Plan drawings switched to the UDA versions that show room dimensions (internal, wall to wall, in metres). Total unit sizes are still not published.')
}

// 195 Harbour View: one row per unit type, each with its own crop of the UDA "Unit Detail" drawing.
{
  const p = await load(195, 'harbour-view-residencies-colombo-13'); const data: Record<string, any> = {}; const log: string[] = []
  if (p.floorPlans.length === 1 && /types A to D/.test(p.floorPlans[0].planName)) {
    const src = path.join(dir, 'img/harbour_view_Unit_Plan_-_harbour_view.jpg')
    const crops: [string, number, number, number, number][] = [['Type A and B - 2 Bedroom', 330, 560, 1250, 1380], ['Type C - 2 Bedroom', 1560, 560, 760, 1380], ['Type D - 2 Bedroom', 2290, 620, 900, 1320]]
    const plans: any[] = []
    for (const [name, left, top, width, height] of crops) {
      const buf = await sharp(src).extract({ left, top, width, height }).extend({ top: 40, bottom: 40, left: 40, right: 40, background: '#ffffff' }).jpeg({ quality: 92 }).toBuffer()
      const image = apply ? await mirrorToR2(`projects/${p.slug}/floor-plans/${p.slug}_${kebab(name)}.jpg`, buf, 'image/jpeg') : '(would upload crop)'
      plans.push({ planName: name, bedrooms: 2, bathrooms: 1, floorAreaSqFt: 550, startingPriceLkr: 11 * M, availability: 'Available', image })
    }
    data.floorPlans = plans; log.push('plans: 1 combined row -> Types A and B, C, D')
  }
  await save(p, data, log)
  await todoNote(195, 'The single plan row was split into three (Types A and B, Type C, Type D), each with its own crop of the UDA unit drawing. Types A and B are mirror images drawn together. All carry 550 sq ft (flyer) and Rs 11 million; the drawing marks 500 sq ft.')
}

// 193 Crescendo: check only.
{
  const p = await load(193, 'crescendo-apartments-malabe')
  console.log(p.id, p.name, '-> no change:', p.floorPlans.length, 'plans,', p.floorPlans.filter((f: any) => f.image).length, 'with drawings')
}
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)

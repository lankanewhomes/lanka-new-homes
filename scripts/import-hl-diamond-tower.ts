/* eslint-disable @typescript-eslint/no-explicit-any -- one-off import script */
// Home Lands Diamond Tower, Thummulla (Home Lands group HQ): UNPUBLISHED draft + to-dos.
//   NODE_ENV=production npx tsx scripts/import-hl-diamond-tower.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const SO = (await import('../src/collections/shared-fields')) as any
const payload = await getPayload({ config: cfg })

const find = async (collection: string, slug: string) =>
  ((await payload.find({ collection: collection as never, where: { slug: { equals: slug } }, limit: 1, overrideAccess: true, depth: 0 })).docs[0] as any) ?? null
const n1 = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const so = (o: any, name: string, opts: string[]) => {
  const v = o[name]; if (v == null || v === '') return
  const hit = opts.find((x) => n1(x) === n1(String(v)))
  if (hit) { o[name] = hit; return }
  o[`${name}_other`] = v; delete o[name]
}
const SLUG = 'diamond-tower'
const SOURCE = 'https://www.dailymirror.lk/business-news/Home-Lands-Group-breaks-ground-on-Diamond-Tower-its-new-headquarters-in-Colombo/273-353484'
if (await find('projects', SLUG)) { console.log('exists', SLUG); process.exit(0) }
const dev = await find('developers', 'home-lands')
if (!dev) throw new Error('developer missing')
const nb = await find('neighborhoods', 'thummulla-handiya')

const render = await mirrorToR2(`projects/${SLUG}/gallery/${SLUG}_tower-render-dusk.jpg`, fs.readFileSync('/tmp/dt/diamond-render.jpg'), 'image/jpeg')
const data: Record<string, any> = {
  slug: SLUG, name: 'Diamond Tower', developer: dev.id, isPublished: false,
  status: 'Under Construction', constructionStatus: 'Foundation',
  type: 'Mixed-Use', typeNote: 'Corporate headquarters office tower',
  location: 'Thummulla, Colombo', city: 'Colombo', district: 'Colombo', province: 'Western',
  neighborhood: nb?.id,
  contractor: 'Heyraa Construction',
  floors: 21,
  startingPriceLkr: 0,
  summary: "A 21-floor corporate headquarters tower in Thummulla, Colombo, with a diamond-patterned façade and a diamond-shaped crown, rising above three basement levels.",
  description:
    "Diamond Tower is the new corporate headquarters of the Home Lands Group of Companies in Thummulla, Colombo. The tower rises 21 floors above three basement levels. Inspired by the brilliance and strength of a diamond, its futuristic design features a distinctive diamond-patterned façade and a signature diamond-shaped crown. The developer describes it as a building of the future, combining intelligent design, advanced building technology and modern, dynamic workspaces. It is being built by Heyraa Construction, the Group's own construction arm, which holds the highest CS2 grading from the Construction Industry Development Authority (CIDA). The groundbreaking and foundation stone laying ceremony was led by the Group's Chairman and Managing Director, and completion is scheduled for thirty months from the groundbreaking. This is the Group's own head office building; no units, sizes or prices have been published.",
  highlights: [
    '21 floors above three basement levels in Thummulla, Colombo',
    'Diamond-patterned façade and diamond-shaped crown',
    'Built by Heyraa Construction (CIDA CS2 grade)',
    'Scheduled for completion in thirty months from groundbreaking',
  ],
  heroImage: render,
  gallery: [{ label: 'Diamond Tower at dusk (developer render)', image: render }],
  sourceUrl: SOURCE,
  socialLinks: { whatsapp: 'https://wa.me/94710299444' },
}
for (const k of ['district', 'city', 'province'] as const) so(data, k, SO[`${k.toUpperCase()}_OPTIONS`])
const created: any = await payload.create({ collection: 'projects', data: data as never, overrideAccess: true })
console.log('created', created.id, created.slug, 'published:', created.isPublished)

const links = [SOURCE, `https://www.lankanewhomes.com/listing-preview/${SLUG}`]
const todos: [string, string?][] = [
  ['Video missing', 'Owner said the developer has a video. None is in the Daily Mirror article and none turned up on YouTube (searched 2026-10-27). Ask the owner or the developer for the link and add it under Videos.'],
  ['Is this a sale listing?', 'The article presents Diamond Tower only as the Group\'s own headquarters. Nothing says any floor is for sale or lease. Confirm with the owner whether to keep it as a listing or move it to a news item.'],
  ['Only one small image', 'The only render found is the article\'s 550x310 lead image. Ask the developer for higher-resolution renders and a facade/crown close-up.'],
  ['Exact address and map pin', 'Only "Thummulla, Colombo" is published. No map pin set; do not assume it shares the Pentara Residencies site.'],
  ['Units, floor plans, sizes, price', 'None published (office headquarters).'],
  ['Groundbreaking date', 'The article is not dated in the page text we read; the 30-month completion is counted from the groundbreaking. Handover date left blank.'],
  ['Amenities and key features', 'None published beyond "intelligent design, advanced building technology".'],
  ['WhatsApp number', 'Project WhatsApp set to +94 71 029 9444 (Home Lands default); the article gives no number.'],
  ['Publish?'],
]
for (const [title, notes] of todos) {
  await payload.create({ collection: 'listing-todos' as never, data: { title, listingType: 'project', project: created.id, notes, sourceLinks: links.join('\n') } as never, overrideAccess: true })
}
console.log('todos', todos.length)
process.exit(0)

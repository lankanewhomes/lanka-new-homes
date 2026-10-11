/* eslint-disable @typescript-eslint/no-explicit-any */
// Seeds the CMS To-do list (collection listing-todos) with the open items we know about. Safe to re-run: a row is only created
// when the same listing + title is not there yet.   NODE_ENV=production npx tsx scripts/seed-listing-todos.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

type Row = { slug?: string; title: string; done?: boolean; notes?: string }
const rows: Row[] = [
  // Bay One Residences Colombo
  { slug: 'bay-one-residences-colombo', title: 'Floor plan drawings: 4-bedroom type G, type H and the Penthouse', notes: 'Not in the brochure; ask the developer for the drawings.' },
  { slug: 'bay-one-residences-colombo', title: 'Penthouse bathrooms', notes: 'Left blank because no source gives a number.' },
  { slug: 'bay-one-residences-colombo', title: 'Per-plan prices', notes: 'Every plan says "Contact for pricing"; the developer only publishes the overall from-price.' },
  { slug: 'bay-one-residences-colombo', title: 'Units sold and available update by themselves', done: true, notes: 'Cloudflare cron every 6 hours reads the developer explorer.' },
  { slug: 'bay-one-residences-colombo', title: 'Completion year 2028', done: true },
  { slug: 'bay-one-residences-colombo', title: 'Add brochure content: architect (MIX Architecture), finishes, design features, building facts, video, construction timeline, FAQs', notes: 'All from the brochure and the developer news posts; waiting for the owner to say go.' },
  { slug: 'bay-one-residences-colombo', title: 'Main contractor: ICC Construction', done: true, notes: 'Name confirmed by the owner on 2026-10-11.' },
  // Crystal Sands (Sky Villa Residences)
  { slug: 'crystal-sands-sky-villas', title: 'Units available: 7 on the residences page, 1 on the developer group site. Which is right?' },
  { slug: 'crystal-sands-sky-villas', title: 'Confirm bathrooms (2 / 2 / 3 / 4, from the developer group site)' },
  { slug: 'crystal-sands-sky-villas', title: 'Replace 4 low-resolution photos with better ones' },
  // Prime Lands apartment drafts (all unpublished)
  { slug: 'the-golf-colombo-08', title: 'Map pin: the developer pin is in the sea. Get the real location', notes: 'Brochure says Lake Drive beside Royal Colombo Golf Club.' },
  { slug: 'the-golf-colombo-08', title: 'Publish?' },
  { slug: 'mon-vie-colombo-05', title: 'Map pin is about 250 m off (labelled Elizabeth Moir Senior School); price is 90M vs 86M / 69M on the page' },
  { slug: 'mon-vie-colombo-05', title: 'Publish?' },
  { slug: 'the-seasons-colombo-08', title: 'Publish?' },
  { slug: 'the-palace-gampaha', title: 'Two map pins about 1 km apart; confirm units really remain (completed building)' },
  { slug: 'the-palace-gampaha', title: 'Publish?' },
  { slug: 'prime-kadawatha', title: 'Confirm units remain (page only says 100 sold in 7 weeks) and the 1322 hotline as the phone number' },
  { slug: 'prime-kadawatha', title: 'Publish?' },
  { slug: 'the-colombo-border-peliyagoda', title: 'Ask Prime Lands for the brochure, block plan and road map (links are broken)' },
  { slug: 'the-colombo-border-peliyagoda', title: 'Confirm pool, gym, cafe and meeting room (only from renders)' },
  { slug: 'the-colombo-border-peliyagoda', title: 'Publish?' },
  { slug: 'yolo-kiribathgoda', title: 'Add the other ~10 unit types (B, C\', D, E, F, G, J, J\', K, M)?' },
  { slug: 'yolo-kiribathgoda', title: 'Photos carry baked-in "BOI Approved" badges: keep or drop?' },
  { slug: 'yolo-kiribathgoda', title: 'Publish?' },
  { slug: 'j-adore-negombo', title: 'Bathrooms 1-3 vs 1-4 and airport time 15 vs 10 minutes' },
  { slug: 'j-adore-negombo', title: 'Publish?' },
  { slug: 'venezia-negombo', title: 'Gallery is mostly lifestyle renders' },
  { slug: 'venezia-negombo', title: 'Publish?' },
  { slug: 'skye-blossom-kottawa', title: 'Map point: two sources 650 m apart' },
  { slug: 'skye-blossom-kottawa', title: 'Publish?' },
  { slug: 'the-reflection-samagi-mawatha-thalawathugoda', title: 'Map pin may belong to The Residence Samagi Mawatha; phone 070 433 66 44 vs 070 700 55 66' },
  { slug: 'the-reflection-samagi-mawatha-thalawathugoda', title: 'Publish?' },
  // Other projects
  { slug: 'prime-villas-thalawathugoda-weera-mawatha', title: 'Missing map coordinates' },
  { slug: 'viva-la-vida', title: 'Missing map coordinates' },
  // General
  { title: 'Prime Lands: which WhatsApp number to use on all Prime Lands listings (wa.me/94112030800 was copied from older drafts)' },
  { title: 'Terraces and parking for all listings: terrace count/type per plan, parking type, visitor parking, EV' },
  { title: 'Neighbourhood photos: Meegoda, Meepe, Bandaragama need real photos' },
  { title: 'Gangani lands: missing drain / size / road source data' },
  { title: 'Add more ICC Port City projects (send the links)' },
  { title: 'Make the developers email (mailbox or invite sender?)' },
]

const idBySlug = new Map<string, { id: number; name: string }>()
for (const slug of [...new Set(rows.map((r) => r.slug).filter(Boolean) as string[])]) {
  const f: any = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0 })
  if (f.docs[0]) idBySlug.set(slug, { id: f.docs[0].id, name: f.docs[0].name })
  else console.log('NOT FOUND', slug)
}
let created = 0
for (const row of rows) {
  const project = row.slug ? idBySlug.get(row.slug) : undefined
  if (row.slug && !project) continue
  const where: any = project ? { and: [{ title: { equals: row.title } }, { project: { equals: project.id } }] } : { and: [{ title: { equals: row.title } }, { listingType: { equals: 'other' } }] }
  const exists: any = await payload.find({ collection: 'listing-todos', where, limit: 1, depth: 0 })
  if (exists.docs[0]) continue
  if (apply) {
    await payload.create({ collection: 'listing-todos', data: { title: row.title, done: Boolean(row.done), notes: row.notes, listingType: project ? 'project' : 'other', ...(project ? { project: project.id } : { listingName: 'General' }) } as any, depth: 0 })
  }
  created += 1
}
console.log(apply ? 'created' : 'would create', created, 'of', rows.length)
if (apply) {
  const b: any = await payload.find({ collection: 'projects', where: { slug: { equals: 'bay-one-residences-colombo' } }, limit: 1, depth: 0 })
  await payload.update({ collection: 'projects', id: b.docs[0].id, data: { contractor: 'ICC Construction' }, depth: 0 })
  console.log('Bay One contractor set')
}
process.exit(0)

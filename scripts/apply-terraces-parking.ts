/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over researched JSON + arbitrary CMS docs */
// Applies researched, developer-published outdoor-space counts (per floor plan), parking type, visitor parking and
// EV charging. Never overwrites a value already set. Skips plans flagged ambiguous/approximate and the listed holds.
//   RESEARCH_DIR=<scratchpad/research> NODE_ENV=production npx tsx scripts/apply-terraces-parking.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.RESEARCH_DIR ?? ''
if (!dir) throw new Error('Set RESEARCH_DIR')
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

// Whole projects held back: the brochure drawings are titled for a different project (needs the owner's confirmation).
const HOLD_PROJECTS = new Set(['prime-evoke-kadawatha'])
// Counts the researcher could only give for part of the outdoor space (roof terraces only) — not stated as complete.
const HOLD_PLANS_BY_PROJECT = new Set(['clover-thalawathugoda'])
const DOUBTFUL = /ambig|approx|low[- ]conf|unclear|uncertain|same (t1|drawing|image)|placeholder|mismatch/i

const NOUN: [RegExp, string, string][] = [
  [/balcon/i, 'Balconies', 'balcony'], [/terrace/i, 'Terraces', 'terrace'], [/ver(r)?and?ah|varanda|veranda/i, 'Verandahs', 'verandah'], [/deck/i, 'Decks', 'deck'],
]
function labelFromWord(word: string): string | null {
  const found = NOUN.filter(([re]) => re.test(word)).map(([, plural]) => plural)
  const uniq = [...new Set(found)]
  if (!uniq.length) return null
  return uniq.length === 1 ? uniq[0] : uniq.map((u, i) => (i === 0 ? u : u.toLowerCase())).join(' & ')
}
function parkingFrom(raw: string | null): { parkingType?: string; parkingType_other?: string } | null {
  if (!raw) return null
  const t = raw.toLowerCase()
  if (/parking bay|large parking bays/.test(t)) return null // bays drawn, no type stated
  if (/private \(dedicated\)|dedicated parking/.test(t)) return { parkingType: 'Private (Dedicated)' }
  if (/^assigned/.test(t)) return { parkingType: 'Assigned' }
  if (/car lift|car hoist/.test(t)) return { parkingType_other: /hoist/.test(t) ? 'Indoor parking with car hoists' : 'Car lift parking' }
  if (/indoor/.test(t)) return { parkingType: 'Indoor' }
  if (/basement/.test(t)) return { parkingType_other: 'Basement parking' }
  if (/^garage/.test(t)) return { parkingType: 'Garage' }
  if (/^covered/.test(t)) return { parkingType: 'Covered' }
  return null
}

const research: Record<string, any> = {}
for (const f of fs.readdirSync(dir)) if (f.endsWith('.json') && f !== 'groups.json') Object.assign(research, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))

const tally = { plans: 0, projectsTouched: 0, parking: 0, visitor: 0, ev: 0, skippedPlans: 0 }
const rowsOut: string[] = []
for (const [slug, r] of Object.entries(research)) {
  if (HOLD_PROJECTS.has(slug)) { rowsOut.push(`${slug}: HELD (owner to confirm drawings)`); continue }
  const d: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!d) { rowsOut.push(`${slug}: not found`); continue }
  const data: any = {}
  const notes: string[] = []
  // plans
  let planCount = 0
  const plans = (d.floorPlans ?? []).map((p: any) => {
    const rp = (r.plans ?? []).find((x: any) => x.name === p.planName)
    if (!rp || rp.terraces == null || !rp.word) return p
    if (HOLD_PLANS_BY_PROJECT.has(slug) || DOUBTFUL.test(`${rp.evidence ?? ''}`) || (slug === 'barrington-towers' && ['B', 'D', 'E', 'G'].some((x) => new RegExp(`\\b${x}\\b`).test(p.planName))) || (slug.startsWith('capitol') && /junior|4\s*\/?\s*5/i.test(p.planName))) { tally.skippedPlans++; return p }
    const label = labelFromWord(String(rp.word))
    if (!label || p.terraces != null) return p
    planCount++
    return { ...p, terraces: rp.terraces, outdoorSpace: label, ...(rp.type ? { terraceType: rp.type } : {}) }
  })
  if (planCount) { data.floorPlans = plans; tally.plans += planCount }
  // parking type
  if (!d.parkingType && !d.parkingType_other) {
    const pk = parkingFrom(r.parkingType)
    if (pk) { Object.assign(data, pk); tally.parking++; notes.push(`parking ${pk.parkingType ?? pk.parkingType_other}`) }
  }
  // visitor parking
  if (!d.visitorParking && typeof r.visitorParking === 'string' && /^yes/i.test(r.visitorParking)) {
    const bays = r.visitorParking.match(/(\d+)\s*bays/i)
    data.visitorParking = bays ? `Yes (${bays[1]} bays)` : 'Yes'; tally.visitor++; notes.push('visitor')
  }
  // EV charging
  if ((r.ev === 'Yes' || r.ev === 'Provision') && !(d.amenities ?? []).some((a: any) => a.name === 'EV Charging')) {
    data.amenities = [...(d.amenities ?? []).map((a: any) => ({ name: a.name })), { name: 'EV Charging' }]; tally.ev++; notes.push('EV')
  }
  if (Object.keys(data).length) {
    tally.projectsTouched++
    rowsOut.push(`${slug}: ${planCount ? `${planCount}/${(d.floorPlans ?? []).length} plans outdoor counts; ` : ''}${notes.join(', ')}`)
    if (apply) await payload.update({ collection: 'projects', id: d.id, data, overrideAccess: true })
  } else rowsOut.push(`${slug}: nothing to add`)
}
console.log(rowsOut.join('\n'))
console.log(apply ? 'APPLIED' : 'DRY RUN', JSON.stringify(tally))
process.exit(0)

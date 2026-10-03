/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over arbitrary CMS docs */
// Owner, 2026-10-03: delete "who published it / not published, contact the developer" boilerplate from pricing notes,
// and source tags such as "(developer FAQ)" from Key Features and Ownership & Services values. Where there is no data, nothing is shown.
//   NODE_ENV=production npx tsx scripts/clean-meta-text.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const NOTE_META = /developer[- ]published|published by the developer|stated by the developer|developer[- ]stated|developer states|developer has not published|developer does not publish|has not published|not (yet )?(been )?published|contact the developer|contact the sales team|to be announced by the developer|brochure states|apartments start from|attractive pricing/i
// Informative sentences that only carry a source tag: keep the sentence, drop the tag.
const TAG = /\s*\((?:developer[- ]stated|developer FAQ|developer wording|brochure|page|project page|site general features|brochure general specifications|per FAQ|FAQ|website|developer website)\)/gi
const stripTag = (s: string) => s.replace(TAG, '').replace(/\s{2,}/g, ' ').trim()
const slim = (i: any) => ({ field: i.field, field_other: i.field_other, value: i.value, value_other: i.value_other })

const all = await payload.find({ collection: 'projects', limit: 1000, depth: 0, pagination: false, overrideAccess: true })
let notesDel = 0, tagsStripped = 0, touched = 0
for (const p of all.docs as any[]) {
  const data: any = {}
  const notes: string[] = p.pricingNotes ?? []
  const kept = notes.filter((n) => !NOTE_META.test(n)).map(stripTag)
  if (kept.length !== notes.length || kept.some((n, i) => n !== notes.filter((x) => !NOTE_META.test(x))[i])) { data.pricingNotes = kept; notesDel += notes.length - kept.length }
  for (const key of ['unitFeatures', 'ownershipServices']) {
    let changed = false
    const groups = (p[key] ?? []).map((g: any) => ({ key: g.key, key_other: g.key_other, label: g.label, items: (g.items ?? []).map((i: any) => {
      const v = i.value_other ?? i.value ?? ''
      const nv = stripTag(String(v))
      if (nv !== v) { changed = true; tagsStripped++; return { ...slim(i), ...(i.value_other != null ? { value_other: nv } : { value: nv }) } }
      return slim(i)
    }) }))
    if (changed) data[key] = groups
  }
  if (p.slug === 'fairway-latitude') Object.assign(data, { reservationFee: null, reservationDeposit: null, depositPaymentStructure: null, paymentPlan: null })
  if (Object.keys(data).length) {
    touched++
    console.log(`${p.slug}: ${Object.keys(data).join(', ')}${data.pricingNotes ? ` (notes ${notes.length}->${data.pricingNotes.length})` : ''}`)
    if (apply) await payload.update({ collection: 'projects', id: p.id, data, overrideAccess: true })
  }
}
console.log(apply ? 'APPLIED' : 'DRY RUN', `${touched} listings, ${notesDel} notes deleted, ${tagsStripped} source tags stripped`)
process.exit(0)

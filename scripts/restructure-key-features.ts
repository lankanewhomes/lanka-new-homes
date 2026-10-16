/* eslint-disable @typescript-eslint/no-explicit-any -- one-off data script */
// 2026-10-16 (owner: 10-tab Key Features structure, no shared facilities, no basic facts), projects AND lands.
//   DRY=1 NODE_ENV=production npx tsx scripts/restructure-key-features.ts   (plan only)   |   without DRY it writes
// - every tab is renamed to the canonical set (Specifications, Finishes, General Features, Safety & Security, Indoor Features,
//   Building & Services, Outdoor Features, Sustainability, Accessibility, Utilities); same-named tabs are merged
// - shared facilities that already exist in Amenities (pool, gym, clubhouse, playground...) are removed (their text fills a blank
//   amenity description first)
// - pure basic facts (bedroom/bathroom counts, floor areas) and balcony rows in Outdoor are removed
// - "Highlights" tab rows move to the project's Highlights list; the "Recreation & Wellness" tab is dissolved into Amenities where a
//   matching amenity exists (anything left stays and is reported)
import path from 'node:path'
import fs from 'node:fs'
import { config } from 'dotenv'
config({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const p = await getPayload({ config: cfg })
const o = { overrideAccess: true, depth: 0 } as any
const DRY = process.env.DRY === '1'
const ORDER = ['specifications', 'finishes', 'general-features', 'safety-security', 'indoor', 'building-services', 'outdoor', 'recreation-wellness', 'sustainability', 'accessibility', 'utilities', 'road-access']
const LABEL: Record<string, string> = { specifications: 'Specifications', finishes: 'Finishes', 'general-features': 'General Features', 'safety-security': 'Safety & Security', indoor: 'Indoor Features', 'building-services': 'Building & Services', outdoor: 'Outdoor Features', 'recreation-wellness': 'Recreation & Wellness', sustainability: 'Sustainability', accessibility: 'Accessibility', utilities: 'Utilities', 'road-access': 'Road & Access' }
const TAB: Record<string, string> = { specifications: 'specifications', 'design features': 'specifications', finishes: 'finishes', 'general features': 'general-features', 'safety & security': 'safety-security', 'safety and security': 'safety-security', safety: 'safety-security', indoor: 'indoor', 'indoor features': 'indoor', 'building & services': 'building-services', 'building and services': 'building-services', 'services & facilities': 'building-services', 'resort services': 'building-services', outdoor: 'outdoor', 'outdoor features': 'outdoor', sustainability: 'sustainability', accessibility: 'accessibility', 'age-friendly design': 'accessibility', utilities: 'utilities', 'recreation & wellness': 'recreation-wellness', 'road & access': 'road-access', included: 'general-features', 'building facts': 'specifications' }
const FACILITY: Record<string, (a: string) => boolean> = {
  pool: (a) => /pool/i.test(a), 'swimming pool': (a) => /pool/i.test(a), 'infinity pool': (a) => /pool/i.test(a), 'kids pool': (a) => /pool/i.test(a),
  gym: (a) => /gym/i.test(a), gymnasium: (a) => /gym/i.test(a), fitness: (a) => /gym|pilates|yoga/i.test(a), 'sky gym': (a) => /gym/i.test(a),
  clubhouse: (a) => a === 'Clubhouse', 'club house': (a) => a === 'Clubhouse', 'jogging track': (a) => /track|walk|cycling/i.test(a), 'walking track': (a) => /track|walk/i.test(a),
  playground: (a) => /child|kids/i.test(a), 'kids play area': (a) => /child|kids/i.test(a), "children's play area": (a) => /child|kids/i.test(a), "children's area": (a) => /child|kids/i.test(a),
  sauna: (a) => a === 'Sauna', 'steam room': (a) => a === 'Steam Room', spa: (a) => a === 'Spa', jacuzzi: (a) => a === 'Jacuzzi',
  'tennis court': (a) => /court/i.test(a), 'badminton court': (a) => a === 'Badminton Court', 'basketball court': (a) => a === 'Basketball Court', 'squash court': (a) => /squash/i.test(a), 'squash courts': (a) => /squash/i.test(a), 'pickleball court': (a) => /pickle/i.test(a),
  bbq: (a) => a === 'BBQ Area', 'bbq area': (a) => a === 'BBQ Area', 'games room': (a) => a === 'Games Room', lounge: (a) => /lounge/i.test(a), 'residents lounge': (a) => /lounge/i.test(a), cinema: (a) => a === 'Mini Cinema', rooftop: (a) => /roof/i.test(a), 'roof top': (a) => /roof/i.test(a), parking: (a) => a === 'Parking', 'ev charging': (a) => a === 'EV Charging', 'yoga': (a) => /yoga/i.test(a), 'meditation': (a) => /meditation/i.test(a), 'library': (a) => a === 'Library', 'function hall': (a) => a === 'Function Room', 'conference': (a) => a === 'Meeting Room',
}
const BASIC = new Set(['bedrooms', 'bedroom', 'bathrooms', 'bathroom count', 'floor area', 'floor area range', 'area', 'size', 'unit size', 'home size', 'net living area', 'living area', 'total area', 'land size', 'extent', 'perches', 'number of bedrooms', 'number of bathrooms'])
const PURE_NUMBER = /^[\d.,\s\-–to+]*\s*(sq\.?\s?ft|sqft|sq\.?\s?m|m²|perches?|bedrooms?|bathrooms?|beds?|baths?)?\.?$/i
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z0-9&'-]+/g, ' ').trim()
const label = (g: any) => String(g.key_other || g.label || g.key || '').trim()
const stats: any = { listings: 0, tabsRenamed: 0, facilities: 0, basics: 0, balconies: 0, highlights: 0, merged: 0 }
const kept: string[] = []
const out: string[] = []
const backup: any[] = []
for (const coll of ['projects', 'lands'] as const) {
  const docs = (await p.find({ collection: coll, limit: 600, pagination: false, ...o })).docs as any[]
  for (const x of docs) {
    backup.push({ coll, id: x.id, slug: x.slug, unitFeatures: x.unitFeatures || [], highlights: x.highlights, amenities: x.amenities })
    const amen: string[] = (x.amenities || []).map((a: any) => a.name)
    const descPatch = new Map<string, string>()
    const hl: string[] = []
    const docs: any[] = []
    const notes: string[] = []
    const buckets = new Map<string, any[]>(); const leftovers: any[] = []
    for (const g of (x.unitFeatures || [])) {
      const lab = label(g); const ln = norm(lab)
      let canon = TAB[ln] ?? (g.key && ORDER.includes(g.key) ? g.key : undefined)
      const isHighlights = ln === 'highlights' && coll === 'projects'
      const isRec = false
      if (ln === 'plot availability') { notes.push('plot availability tab deleted'); stats.plotAvail = (stats.plotAvail || 0) + 1; continue }
      if (ln === 'documentation' || ln === 'documents') { docs.push(...(g.items || []).map((i: any) => ({ field_other: String(i.field || i.field_other || ''), value: String(i.value || i.value_other || '') }))); stats.docs = (stats.docs || 0) + 1; continue }
      const items: any[] = []
      for (const it of (g.items || [])) {
        const f = norm(it.field || it.field_other); const v = String(it.value || it.value_other || '').trim()
        if (isHighlights) { const t = (it.field || it.field_other ? `${it.field || it.field_other}: ${v}` : v).trim(); if (t) { hl.push(t); stats.highlights++ } continue }
        if (BASIC.has(f) && PURE_NUMBER.test(v)) { stats.basics++; notes.push('basic ' + f); continue }
        if (canon === 'outdoor' && /^balcon(y|ies)$/.test(f)) { stats.balconies++; notes.push('balcony'); continue }
        const test = FACILITY[f]
        if (test && !(f === 'garden' ) ) {
          const match = amen.find(test)
          if (match) { if (v && v.length < 200 && norm(v) !== norm(match) && !descPatch.has(match)) descPatch.set(match, v); stats.facilities++; notes.push(`${it.field || f}→${match}`); continue }
        }
        items.push(it)
      }
      if (!items.length) continue
      if (isRec || (!canon && !isHighlights && ln !== '')) { if (isRec) kept.push(`${coll}/${x.slug}: Recreation & Wellness left: ${items.map((i) => i.field || i.field_other).join(', ')}`); leftovers.push({ ...g, items }); continue }
      if (!canon) { leftovers.push({ ...g, items }); continue }
      if (ln !== norm(LABEL[canon]) ) stats.tabsRenamed++
      buckets.set(canon, [...(buckets.get(canon) || []), ...items]); if ((buckets.get(canon) || []).length && x.unitFeatures.filter((q: any) => (TAB[norm(label(q))] ?? q.key) === canon).length > 1) stats.merged++
    }
    const groups = [
      ...ORDER.filter((k) => buckets.has(k)).map((k) => ({ key: k, label: LABEL[k], items: buckets.get(k)!.map(({ id, ...i }: any) => i) })),
      ...leftovers.map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).map(({ id: _i, ...i }: any) => i) })),
    ]
    const before = JSON.stringify((x.unitFeatures || []).map((g: any) => [label(g), (g.items || []).length]))
    const after = JSON.stringify(groups.map((g: any) => [label(g), g.items.length]))
    if (before === after && !hl.length && !descPatch.size && !docs.length) continue
    stats.listings++
    if (process.env.DEBUG && coll === 'lands' && (stats.dbg = (stats.dbg || 0) + 1) < 400 && /Location/.test(before) && stats.dbg % 60 === 0) console.log(coll, x.slug, before, '=>', after)
    if (leftovers.length) out.push(`${coll}/${x.slug} leftover tabs: ${leftovers.map((g: any) => label(g)).join(' | ')}`)
    if (DRY) continue
    const data: any = { unitFeatures: groups }
    if (descPatch.size) data.amenities = (x.amenities || []).map(({ id, ...a }: any) => ({ ...a, description: a.description || descPatch.get(a.name) || a.description }))
    if (docs.length) data.ownershipServices = [...(x.ownershipServices || []).map(({ id, ...g }: any) => ({ ...g, items: (g.items || []).map(({ id: _i, ...i }: any) => i) })), { key_other: 'Documents', label: 'Documents', items: docs }]
    if (hl.length) { const cur: string[] = (x.highlights || []).map((h: any) => (typeof h === 'string' ? h : h?.text ?? h)); const add = hl.filter((t) => !cur.some((c) => norm(c) === norm(t))); data.highlights = [...cur, ...add] }
    await p.update({ collection: coll, id: x.id, data, ...o })
  }
}
if (!DRY || true) fs.writeFileSync('/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/Backups/key-features-before-restructure-2-2026-10-16.json', JSON.stringify(backup))
console.log(JSON.stringify(stats))
console.log('--- recreation leftovers ---'); console.log(kept.join('\n'))
console.log('--- leftover tabs (unmapped) ---'); const c = new Map<string, number>(); for (const l of out) for (const t of l.split(': ')[1].split(' | ')) c.set(t, (c.get(t) || 0) + 1); console.log([...c.entries()].map(([k, v]) => v + ' ' + k).join('\n'))
console.log(DRY ? 'DRY RUN' : 'WRITTEN')
process.exit(0)

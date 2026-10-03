/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over researched JSON + arbitrary CMS docs */
// Fills "Ownership & Services" (ownershipServices), the team facts and tenure from the researched developer-published data.
// Excludes values that are unverified, conflicting or negative statements (see EXCLUDE). Never overwrites a team value already set.
//   RESEARCH_DIR=<scratchpad/research> NODE_ENV=production npx tsx scripts/apply-ownership-services.ts [--apply]
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

const LABEL: Record<string, string> = {
  tenure: 'Freehold / Leasehold', foreignOwnership: 'Foreign Ownership', titleInformation: 'Title Information', buyerEligibility: 'Buyer Eligibility', purchaseRequirements: 'Purchase Requirements', requiredDocuments: 'Required Documents', legalRequirements: 'Legal Requirements',
  warranty: 'Warranty', handoverSupport: 'Handover Support', propertyManagement: 'Property Management', maintenance: 'Maintenance', residentServices: 'Resident Services',
}
const OWN = ['tenure', 'foreignOwnership', 'titleInformation', 'buyerEligibility', 'purchaseRequirements', 'requiredDocuments', 'legalRequirements']
const AFT = ['warranty', 'handoverSupport', 'propertyManagement', 'maintenance', 'residentServices']
// Unverified (earlier repo report / 2017 archive), conflicting between sources, or not about this project.
const EXCLUDE_SLUG = new Set(['barrington-towers'])
const EXCLUDE_FIELD: Record<string, string[]> = {
  'aathavan-apartments-dehiwala': ['purchaseRequirements'],
  'prime-life-kadawatha': ['purchaseRequirements', 'residentServices'],
  'the-residence-samagi-mawatha-thalawathugoda': ['purchaseRequirements'],
}
const clean = (v: any): string | null => {
  if (typeof v !== 'string') return null
  const t = v.trim().replace(/^Developer FAQ \(group-wide\):\s*/i, '').replace(/\s*\(group-wide FAQ\)\s*$/i, '')
  if (!t || /^not stated$/i.test(t) || /^no coc\/cma/i.test(t) || /^unnamed/i.test(t)) return null
  return t.charAt(0).toUpperCase() + t.slice(1)
}
const ARCHITECTS: Record<string, [string, string]> = {
  'cinnamon-life-apartments': ['Cecil Balmond', 'cecil-balmond'],
  'capitol-twinpeaks': ['P&T Group Architects (Singapore)', 'pt-group-architects'],
  'oceana-wadduwa': ['Philip Weeraratne (PWA Architects)', 'pwa-architects'],
  'rush-metropolis-dehiwala': ['Anushka Dassanayaka', 'anushka-dassanayaka'],
  'rush-tower-2-dehiwala': ['Ajantha Dias', 'ajantha-dias'],
}
const TEAM_TEXT: Record<string, Record<string, string>> = {
  'capitol-twinpeaks': { structuralEngineer: 'Civil and Structural Engineering Consultants (Pvt) Ltd', contractor: 'Sanken Construction (Pvt) Limited' },
  'rush-metropolis-dehiwala': { structuralEngineer: 'Laksiri Cooray (C.Eng)' },
  'rush-tower-2-dehiwala': { structuralEngineer: 'Laksiri Cooray (C.Eng)' },
  'villa-samagi': { contractor: 'Ishara (Maison Ceylon partner contractor)', projectManagementCompany: 'Maison Ceylon' },
  'villa-senehasa': { contractor: 'Ishara (Maison Ceylon partner contractor)', projectManagementCompany: 'Maison Ceylon' },
  'villa-sahana': { contractor: 'Ishara (Maison Ceylon partner contractor)', projectManagementCompany: 'Maison Ceylon' },
  'panimozhi-club-house-kalkudah': { projectManagementCompany: 'Excello Developers' },
  'aathavan-apartments-dehiwala': { projectManagementCompany: 'Excello Developers' },
}
// Fairway Latitude: from the developer's site/brochure, collected earlier in this session.
const FAIRWAY = {
  ownership: { tenure: 'Freehold apartments', foreignOwnership: 'Foreign nationals can purchase (developer FAQ)', buyerEligibility: 'Foreign nationals eligible (developer FAQ)', purchaseRequirements: 'Requesting a reservation costs nothing at the enquiry stage; the sales team confirms the price, payment schedule and reservation deposit within one working day' },
  afterSales: { handoverSupport: 'Engineering and architectural guidance, legal assistance, bank loan facilitation, resale and leasing support on request', propertyManagement: 'On-site building management office', maintenance: 'After-sales support and maintenance coordination', residentServices: 'Resident service app for bookings and requests; concierge service; bicycle racks and storage; interior design consultations on request; Fairway loyalty programme' },
}

const research: Record<string, any> = {}
for (const f of fs.readdirSync(dir)) if (f.startsWith('own_') && f.endsWith('.json')) Object.assign(research, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
research['fairway-latitude'] = FAIRWAY

const group = (label: string, items: { field: string; value: string }[]) => ({ key: label, label, items: items.map((i) => ({ field_other: undefined as any, field: i.field, value: i.value })) })
const stats = { groups: 0, items: 0, projects: 0, tenure: 0, team: 0, architects: 0 }
const out: string[] = []
for (const [slug, r] of Object.entries(research)) {
  if (EXCLUDE_SLUG.has(slug)) { out.push(`${slug}: skipped (unverified source)`); continue }
  const d: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!d) continue
  const ex = new Set(EXCLUDE_FIELD[slug] ?? [])
  const build = (keys: string[], src: any) => keys.map((k) => ({ k, v: ex.has(k) ? null : clean((src ?? {})[k]) })).filter((x) => x.v).map((x) => ({ field: LABEL[x.k], value: x.v as string }))
  const own = build(OWN, r.ownership), aft = build(AFT, r.afterSales)
  const data: any = {}
  const groups = [] as any[]
  if (own.length) groups.push(group('Ownership & Purchase', own))
  if (aft.length) groups.push(group('After-Sales & Services', aft))
  if (groups.length) { data.ownershipServices = groups; stats.groups += groups.length; stats.items += own.length + aft.length }
  // tenure -> Ownership fact when empty and the developer says freehold
  const ten = clean(r.ownership?.tenure)
  if (ten && /^freehold/i.test(ten) && !d.ownership) { data.ownership = 'Freehold'; stats.tenure++ }
  // team facts
  const team = TEAM_TEXT[slug] ?? {}
  for (const [k, v] of Object.entries(team)) if (!d[k]) { data[k] = v; stats.team++ }
  const a = ARCHITECTS[slug]
  if (a && !d.architect) {
    let ar: any = (await payload.find({ collection: 'architects', where: { slug: { equals: a[1] } }, limit: 1, overrideAccess: true })).docs[0]
    if (!ar && apply) ar = await payload.create({ collection: 'architects', data: { name: a[0], slug: a[1] } as any, overrideAccess: true })
    if (ar) data.architect = ar.id
    stats.architects++
  }
  if (slug === 'cinnamon-life-apartments') data.unitFeatures = (d.unitFeatures ?? []).filter((g: any) => (g.key_other ?? g.key) !== 'Project team').map((g: any) => ({ key: g.key, key_other: g.key_other, label: g.label, items: g.items.map((i: any) => ({ field: i.field, field_other: i.field_other, value: i.value, value_other: i.value_other })) }))
  if (Object.keys(data).length) {
    stats.projects++
    out.push(`${slug}: ${own.length} ownership, ${aft.length} after-sales${data.ownership ? ', ownership=Freehold' : ''}${Object.keys(team).length ? ', team ' + Object.keys(team).join('/') : ''}${a ? ', architect ' + a[0] : ''}`)
    if (apply) await payload.update({ collection: 'projects', id: d.id, data, overrideAccess: true })
  }
}
console.log(out.join('\n'))
console.log(apply ? 'APPLIED' : 'DRY RUN', JSON.stringify(stats))
process.exit(0)

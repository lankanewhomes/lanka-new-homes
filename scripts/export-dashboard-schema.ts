// @ts-nocheck
/* eslint-disable */
// Exports the Payload schema as JSON for the mock dashboard UI (src/app/(dashboard)/dashboard/_mock/schema/*.json).
// One file per collection/global + index.json (sidebar, summary) + loaders.ts (lazy import map).
// Run: PAYLOAD_DB_PUSH=false npx tsx --env-file=.env.local scripts/export-dashboard-schema.ts
import fs from 'node:fs'
import { getPayload } from 'payload'
import * as access from '../src/collections/access'

const OUT = 'src/app/(dashboard)/dashboard/_mock/schema'
const cfg = ((await import('../payload.config')) as any).default
const payload = await getPayload({ config: cfg })
const human = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())
const lab = (l: any, name?: string) => (typeof l === 'string' ? l : l && typeof l === 'object' ? l.en ?? Object.values(l)[0] : name ? human(name) : '')
const src = (fn: any) => (typeof fn === 'function' ? fn.toString() : null)

const known = new Map<Function, string>([[access.adminOnly, 'Admin only'], [access.publicRead, 'Public'], [access.authenticatedCreate, 'Any signed-in user'], [access.ownerOrAdmin, 'Admin or record owner'], [access.adminOrSelfById, 'Admin or the user themself'], [access.leadOwnerOrDeveloperOrAdmin, 'Admin, the buyer, or the developer / team member the lead is about'], [access.analyticsOwnerOrAdmin, 'Admin or the developer / team member who owns the project'], [access.manageOwnLands, 'Admin, owning developer, or team member for assigned lands'], [access.adminOnlyField, 'Admin only']])
function acc(fn: any) {
  if (fn === undefined) return 'Signed-in'
  if (typeof fn !== 'function') return String(fn)
  if (known.has(fn)) return known.get(fn)!
  const s = fn.toString()
  if (/^\(?\s*\)?\s*=>\s*true\s*$/.test(s.trim())) return 'Everyone'
  const b: string[] = []
  if (/isAdmin\(|'admin'/.test(s)) b.push('admin')
  if (/getOwned|getTeam|base\(/.test(s)) b.push('owning developer / team member')
  return b.length ? b.join(' or ') : 'Custom rule'
}

function node(f: any): any {
  if (f.type === 'tabs') return { type: 'tabs', tabs: f.tabs.map((t: any) => ({ label: lab(t.label, t.name), name: t.name ?? null, condition: src(t.admin?.condition), fields: (t.fields ?? []).map(node).filter(Boolean) })) }
  if (f.type === 'row' || f.type === 'collapsible') return { type: f.type, label: f.type === 'collapsible' ? lab(f.label) : undefined, collapsed: Boolean(f.admin?.initCollapsed), fields: (f.fields ?? []).map(node).filter(Boolean) }
  if (!f.name) return f.fields ? { type: 'row', fields: f.fields.map(node).filter(Boolean) } : null
  const n: any = { name: f.name, label: lab(f.label, f.name), type: f.type, required: Boolean(f.required) }
  if (f.hasMany) n.hasMany = true
  if (f.type === 'select' || f.type === 'radio') n.options = (f.options ?? []).map((o: any) => (typeof o === 'object' ? { label: lab(o.label, String(o.value)), value: o.value } : { label: String(o), value: o }))
  if (f.type === 'relationship' || f.type === 'upload') n.relationTo = Array.isArray(f.relationTo) ? f.relationTo : [f.relationTo]
  if (f.type === 'join') { n.collection = f.collection; n.on = f.on }
  if (f.defaultValue !== undefined && typeof f.defaultValue !== 'function') n.defaultValue = f.defaultValue
  for (const k of ['min', 'max', 'minLength', 'maxLength']) if (f[k] !== undefined) n[k] = f[k]
  if (f.unique) n.unique = true
  const ad = f.admin ?? {}
  if (typeof ad.description === 'string') n.description = ad.description
  if (ad.readOnly) n.readOnly = true
  if (ad.hidden) n.hidden = true
  if (ad.position) n.position = ad.position
  if (ad.width) n.width = ad.width
  if (ad.condition) n.condition = src(ad.condition)
  if (ad.components?.Field) n.custom = String(typeof ad.components.Field === 'string' ? ad.components.Field : ad.components.Field?.path ?? '').split('#').pop()
  if (f.access?.update && f.access.update !== access.adminOnlyField) n.updateAccess = acc(f.access.update)
  if (f.access?.update === access.adminOnlyField) n.adminOnlyEdit = true
  if (ad.date?.pickerAppearance === 'dayOnly') n.dateOnly = true
  if (f.type === 'group' || f.type === 'array') n.fields = (f.fields ?? []).map(node).filter(Boolean)
  if (f.type === 'array' && f.labels?.singular) n.rowLabel = lab(f.labels.singular)
  if (f.type === 'blocks') n.blocks = f.blocks.map((b: any) => ({ slug: b.slug, label: lab(b.labels?.singular, b.slug), fields: (b.fields ?? []).map(node).filter(Boolean) }))
  return n
}

const navSrc = fs.readFileSync('src/components/payload/AdminNav.tsx', 'utf8')
const sectionsSrc = navSrc.slice(navSrc.indexOf('const SECTIONS'), navSrc.indexOf('export const AdminNav'))
const sections: any[] = []
for (const block of sectionsSrc.split(/\n  \{\n    label: /).slice(1)) {
  const label = block.match(/^"([^"]+)"/)![1]
  const items = [...block.matchAll(/\{ slug: "([^"]+)", kind: "(\w+)"(?:, roles: \[([^\]]*)\])?, label: "([^"]+)", href: "([^"]+)"/g)].map((m) => ({ slug: m[1], kind: m[2], roles: m[3] ? m[3].replace(/"/g, '').split(',').map((x) => x.trim()) : null, label: m[4], filter: (m[5].match(/\?(.*)$/) ?? [])[1] ?? null }))
  sections.push({ label, items })
}

fs.mkdirSync(OUT, { recursive: true })
const collections = payload.config.collections.filter((c: any) => !String(c.slug).startsWith('payload-'))
const summary: any[] = []
const loaders: string[] = []
const visibleFor = (c: any, role: string) => { try { const h = c.admin?.hidden; return typeof h === 'function' ? !h({ user: { role } }) : !h } catch { return true } }
for (const c of collections) {
  const fields = (c.fields ?? []).map(node).filter(Boolean)
  const doc = {
    kind: 'collection', slug: c.slug, label: lab(c.labels?.plural, c.slug), singular: lab(c.labels?.singular, c.slug), group: c.admin?.group ?? null,
    useAsTitle: c.admin?.useAsTitle ?? null, defaultColumns: c.admin?.defaultColumns ?? [], searchable: c.admin?.listSearchableFields ?? [], description: typeof c.admin?.description === 'string' ? c.admin.description : null,
    auth: Boolean(c.auth), upload: Boolean(c.upload), drafts: Boolean(c.versions?.drafts), scopedForDeveloper: Boolean(c.admin?.baseListFilter),
    visible: { admin: visibleFor(c, 'admin'), developer: visibleFor(c, 'developer') },
    access: { read: acc(c.access?.read), create: acc(c.access?.create), update: acc(c.access?.update), delete: acc(c.access?.delete) },
    fields,
  }
  fs.writeFileSync(`${OUT}/${c.slug}.json`, JSON.stringify(doc))
  summary.push({ slug: c.slug, label: doc.label, singular: doc.singular, group: doc.group, visible: doc.visible, scopedForDeveloper: doc.scopedForDeveloper, access: doc.access, useAsTitle: doc.useAsTitle, defaultColumns: doc.defaultColumns })
  loaders.push(`  '${c.slug}': () => import('./${c.slug}.json'),`)
}
const globals: any[] = []
for (const g of payload.config.globals) {
  const doc = { kind: 'global', slug: g.slug, label: lab(g.label, g.slug), fields: (g.fields ?? []).map(node).filter(Boolean), access: { read: acc(g.access?.read), update: acc(g.access?.update) } }
  fs.writeFileSync(`${OUT}/g-${g.slug}.json`, JSON.stringify(doc))
  globals.push({ slug: g.slug, label: doc.label })
  loaders.push(`  'g-${g.slug}': () => import('./g-${g.slug}.json'),`)
}
fs.writeFileSync(`${OUT}/index.json`, JSON.stringify({ generatedAt: new Date().toISOString(), sections, collections: summary, globals }, null, 1))
fs.writeFileSync(`${OUT}/loaders.ts`, `// Generated by scripts/export-dashboard-schema.ts. Do not edit.\nexport const schemaLoaders: Record<string, () => Promise<{ default: unknown }>> = {\n${loaders.join('\n')}\n}\n`)
console.log('exported', collections.length, 'collections,', globals.length, 'globals')
process.exit(0)

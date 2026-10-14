// @ts-nocheck
/* eslint-disable */
// Generates docs/PAYLOAD-SCHEMA.md: every collection and global (fields, types, options, relationships, access, admin conditions)
// plus the /cms sidebar groups and order, read from the loaded Payload config and src/components/payload/AdminNav.tsx.
// Run: npx tsx --env-file=.env.local scripts/generate-payload-schema.ts   (PAYLOAD_DB_PUSH stays off; nothing is written to the database)
import fs from 'node:fs'
import path from 'node:path'
import { getPayload } from 'payload'
import * as access from '../src/collections/access'

const cfg = ((await import('../payload.config')) as any).default
const payload = await getPayload({ config: cfg })

const known = new Map<Function, string>([
  [access.adminOnly, 'Admin only'],
  [access.publicRead, 'Public (anyone)'],
  [access.authenticatedCreate, 'Any signed-in user'],
  [access.ownerOrAdmin, 'Admin, or the owner of the record (user field)'],
  [access.adminOrSelfById, 'Admin, or the user themself'],
  [access.leadOwnerOrDeveloperOrAdmin, 'Admin, the buyer who submitted it, or the developer whose project it is about (including team members for their listings)'],
  [access.analyticsOwnerOrAdmin, 'Admin, or the developer who owns the project (including team members for their listings)'],
  [access.manageOwnLands, 'Admin, the developer who owns the land, or a team member for the lands ticked for them'],
  [access.adminOnlyField, 'Admin only'],
])
function describeAccess(fn: any): string {
  if (fn === undefined) return ''
  if (fn === true) return 'Everyone'
  if (typeof fn !== 'function') return String(fn)
  if (known.has(fn)) return known.get(fn)!
  const src = fn.toString()
  if (/^\(?\s*\)?\s*=>\s*true\s*$/.test(src.trim())) return 'Everyone (guests included)'
  if (/getTeamProjectIds/.test(src) && /base\(/.test(src)) return 'Admin, the developer who owns the company, or a team member for the listings assigned to them'
  const bits: string[] = []
  if (/isAdmin\(|role\s*===\s*['"]admin['"]/.test(src)) bits.push('admin')
  if (/getOwnedDeveloperIds|getOwnedCompanyIds|getOwnedProjectIds/.test(src)) bits.push('the developer who owns the linked company/project')
  if (/getTeamProjectIds|getTeamLandIds/.test(src)) bits.push('team members for their assigned listings')
  if (/ownPayerAccess|payerCollectionForRole/.test(src)) bits.push('the company owner')
  if (/req\.user\)\s*\{|Boolean\(req\.user\)|user\s*\?/.test(src) && !bits.length) bits.push('any signed-in user')
  return bits.length ? `Custom rule: ${bits.join(', ')}` : 'Custom function'
}

const human = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').replace(/^./, (c) => c.toUpperCase())
const labelOf = (f: any) => (typeof f.label === 'string' ? f.label : f.label && typeof f.label === 'object' ? f.label.en ?? Object.values(f.label)[0] : f.name ? human(f.name) : '')
const cell = (v: any) => String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ').trim()
const short = (s: string, n = 140) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const opts = (o: any[]) => (o ?? []).map((x) => (typeof x === 'object' ? (x.label && String(x.label) !== String(x.value) ? `${x.value} (${typeof x.label === 'object' ? Object.values(x.label)[0] : x.label})` : x.value) : x)).join(' · ')

type Row = { path: string; label: string; type: string; required: boolean; details: string; admin: string; access: string }
function walk(fields: any[], prefix: string, rows: Row[], ctx = ''): void {
  for (const f of fields ?? []) {
    if (f.type === 'tabs') {
      for (const tab of f.tabs) {
        const base = tab.name ? `${prefix}${tab.name}.` : prefix
        rows.push({ path: `${prefix}${tab.name ?? ''}`, label: `TAB: ${tab.label && typeof tab.label === 'string' ? tab.label : tab.label?.en ?? tab.name ?? ''}`, type: 'tab', required: false, details: tab.name ? 'named tab (stores a group)' : 'unnamed tab (visual only)', admin: tab.admin?.condition ? 'condition (function)' : '', access: '' })
        walk(tab.fields, base, rows, ctx)
      }
      continue
    }
    if (f.type === 'row' || f.type === 'collapsible') {
      if (f.type === 'collapsible') rows.push({ path: prefix, label: `SECTION: ${typeof f.label === 'string' ? f.label : ''}`, type: 'collapsible', required: false, details: f.admin?.initCollapsed ? 'collapsed by default' : '', admin: '', access: '' })
      walk(f.fields, prefix, rows, ctx)
      continue
    }
    if (!f.name) { if (f.fields) walk(f.fields, prefix, rows, ctx); continue }
    const d: string[] = []
    if (f.type === 'select' || f.type === 'radio') d.push(`options: ${opts(f.options)}`)
    if (f.hasMany) d.push('many')
    if (f.type === 'relationship' || f.type === 'upload') d.push(`→ ${Array.isArray(f.relationTo) ? f.relationTo.join(' | ') : f.relationTo}`)
    if (f.type === 'join') d.push(`reverse of ${f.collection}.${f.on}`)
    if (f.defaultValue !== undefined && typeof f.defaultValue !== 'function') d.push(`default: ${JSON.stringify(f.defaultValue)}`)
    if (typeof f.defaultValue === 'function') d.push('default: computed')
    if (f.min !== undefined) d.push(`min ${f.min}`)
    if (f.max !== undefined) d.push(`max ${f.max}`)
    if (f.minLength !== undefined) d.push(`minLength ${f.minLength}`)
    if (f.maxLength !== undefined) d.push(`maxLength ${f.maxLength}`)
    if (f.unique) d.push('unique')
    if (f.index) d.push('indexed')
    if (f.localized) d.push('localized')
    if (f.type === 'date' && f.admin?.date?.pickerAppearance) d.push(`picker: ${f.admin.date.pickerAppearance}`)
    if (f.type === 'blocks') d.push(`blocks: ${f.blocks.map((b: any) => b.slug).join(', ')}`)
    if (f.type === 'point') d.push('[lng, lat]')
    if (f.validate && f.type !== 'blocks') d.push('custom validation')
    const a: string[] = []
    if (f.admin?.condition) a.push('show/hide condition (function)')
    if (f.admin?.readOnly) a.push('read-only')
    if (f.admin?.hidden) a.push('hidden')
    if (f.admin?.position) a.push(`position: ${f.admin.position}`)
    if (f.admin?.width) a.push(`width ${f.admin.width}`)
    if (f.admin?.components?.Field) a.push(`custom UI: ${String(typeof f.admin.components.Field === 'string' ? f.admin.components.Field : f.admin.components.Field?.path ?? 'component').split('#').pop()}`)
    if (f.admin?.components?.Cell) a.push('custom list cell')
    if (f.admin?.description) a.push(`hint: ${short(typeof f.admin.description === 'string' ? f.admin.description : 'text', 110)}`)
    const acc: string[] = []
    for (const op of ['create', 'read', 'update']) if (f.access?.[op]) acc.push(`${op}: ${describeAccess(f.access[op])}`)
    const p = `${prefix}${f.name}`
    rows.push({ path: p, label: labelOf(f), type: f.type, required: Boolean(f.required), details: d.join('; '), admin: a.join('; '), access: acc.join('; ') })
    if (f.type === 'group') walk(f.fields, `${p}.`, rows, ctx)
    else if (f.type === 'array') walk(f.fields, `${p}[].`, rows, ctx)
    else if (f.type === 'blocks') for (const b of f.blocks) { rows.push({ path: `${p}[${b.slug}]`, label: `BLOCK: ${typeof b.labels?.singular === 'string' ? b.labels.singular : b.slug}`, type: 'block', required: false, details: '', admin: '', access: '' }); walk(b.fields, `${p}[${b.slug}].`, rows, ctx) }
  }
}
function table(rows: Row[]): string {
  let out = '| Field | Label | Type | Req | Details | Admin UI | Field access |\n|---|---|---|---|---|---|---|\n'
  for (const r of rows) out += `| ${cell(r.path) ? '`' + cell(r.path) + '`' : ''} | ${cell(r.label)} | ${r.type} | ${r.required ? '✔' : ''} | ${cell(short(r.details, 400))} | ${cell(r.admin)} | ${cell(r.access)} |\n`
  return out
}

// ---- sidebar from AdminNav.tsx ----
const navSrc = fs.readFileSync('src/components/payload/AdminNav.tsx', 'utf8')
const sectionsSrc = navSrc.slice(navSrc.indexOf('const SECTIONS'), navSrc.indexOf('export const AdminNav'))
const sections: { label: string; items: { slug: string; kind: string; label: string; href: string; roles?: string }[] }[] = []
for (const block of sectionsSrc.split(/\n  \{\n    label: /).slice(1)) {
  const label = block.match(/^"([^"]+)"/)![1]
  const items = [...block.matchAll(/\{ slug: "([^"]+)", kind: "(\w+)"(?:, roles: \[([^\]]*)\])?, label: "([^"]+)", href: "([^"]+)"/g)].map((m) => ({ slug: m[1], kind: m[2], roles: m[3]?.replace(/"/g, ''), label: m[4], href: m[5] }))
  sections.push({ label, items })
}
const inNav = new Set(sections.flatMap((s) => s.items.map((i) => i.slug)))
const allCollections = payload.config.collections.filter((c: any) => !String(c.slug).startsWith('payload-'))
const allGlobals = payload.config.globals
const extra = [...allCollections.filter((c: any) => !inNav.has(c.slug)).map((c: any) => ({ slug: c.slug, kind: 'collection', label: labelOf({ label: c.labels?.plural, name: c.slug }) || human(c.slug), href: `/cms/collections/${c.slug}`, hidden: c.admin?.hidden })), ...allGlobals.filter((g: any) => !inNav.has(g.slug)).map((g: any) => ({ slug: g.slug, kind: 'global', label: human(g.slug), href: `/cms/globals/${g.slug}` }))]

let md = `# Payload schema reference\n\n_Generated by \`scripts/generate-payload-schema.ts\` from the loaded Payload config on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand; re-run the script after changing a collection._\n\n`
md += `Database schema: \`payload\` (Postgres via Supabase). Admin at \`/cms\`, REST at \`/payload-api\`. ${allCollections.length} collections, ${allGlobals.length} globals.\n\n`
md += `## 1. The /cms sidebar (exact groups and order)\n\nSource: \`SECTIONS\` in \`src/components/payload/AdminNav.tsx\`. A developer login only sees the entries their access rules allow; entries marked *view* are custom admin pages, not collections.\n\n`
sections.forEach((s, i) => {
  md += `**${i + 1}. ${s.label}**\n\n| # | Entry | Kind | Opens | Roles |\n|---|---|---|---|---|\n`
  s.items.forEach((it, j) => (md += `| ${j + 1} | ${it.label} | ${it.kind === 'view' ? 'custom view' : it.kind} (\`${it.slug}\`) | \`${it.href}\` | ${it.roles ?? 'by access rules'} |\n`))
  md += '\n'
})
md += `_Above the groups the sidebar always shows a **Dashboard** link (\`/cms\`) and, at the bottom, **Log out**._\n\n**${sections.length + 1}. Other (collections that exist but are not in the sidebar map)**\n\n| Entry | Kind | Why it is not listed |\n|---|---|---|\n`
for (const e of extra) md += `| ${e.label} (\`${e.slug}\`) | ${e.kind} | ${e.hidden ? 'hidden from the admin menu (internal or retired data, kept in the database)' : 'not in the menu map; admins reach it by URL'} |\n`
md += `\nCustom admin views (pages that are not collections): ${Object.entries(payload.config.admin?.components?.views ?? {}).map(([k, v]: any) => `\`${v.path ?? k}\``).join(', ')}. Of these, /mail, /mail/settings, /billing and /my-billing are in the sidebar; /import (import a listing), /lead-activity and /placements (featured placements) exist but are not linked from it.\n\n`

md += `## 2. Summary\n\n| Collection | Admin group (Payload) | Fields (top level) | Read | Create | Update | Delete |\n|---|---|---|---|---|---|---|\n`
const summaries: string[] = []
for (const c of allCollections) {
  const rows: Row[] = []
  walk(c.fields, '', rows)
  summaries.push(`| \`${c.slug}\` | ${c.admin?.group ?? '—'} | ${rows.filter((r) => !['tab', 'block', 'collapsible'].includes(r.type)).length} | ${describeAccess(c.access?.read)} | ${describeAccess(c.access?.create)} | ${describeAccess(c.access?.update)} | ${describeAccess(c.access?.delete)} |`)
}
md += summaries.join('\n') + '\n\n'

md += `## 3. Collections\n\n`
for (const c of allCollections) {
  const rows: Row[] = []
  walk(c.fields, '', rows)
  md += `### ${c.slug}\n\n`
  const meta: string[] = []
  meta.push(`**Label:** ${typeof c.labels?.singular === 'string' ? c.labels.singular : human(c.slug)} / ${typeof c.labels?.plural === 'string' ? c.labels.plural : human(c.slug)}`)
  meta.push(`**Admin group:** ${c.admin?.group ?? '—'}`)
  if (c.admin?.useAsTitle) meta.push(`**Title field:** \`${c.admin.useAsTitle}\``)
  if (c.admin?.defaultColumns) meta.push(`**List columns:** ${c.admin.defaultColumns.map((x: string) => `\`${x}\``).join(', ')}`)
  if (c.admin?.listSearchableFields) meta.push(`**Searchable:** ${c.admin.listSearchableFields.map((x: string) => `\`${x}\``).join(', ')}`)
  if (c.defaultSort) meta.push(`**Default sort:** \`${c.defaultSort}\``)
  if (c.admin?.hidden) meta.push(`**Hidden in the admin:** ${typeof c.admin.hidden === 'function' ? 'by rule (function; typically hidden unless admin)' : 'yes'}`)
  if (c.admin?.baseListFilter) meta.push('**List is pre-filtered** per user (developers see only their own records)')
  if (c.admin?.groupBy) meta.push('**List can be grouped**')
  if (c.upload) meta.push(`**Upload collection** (mime: ${(c.upload.mimeTypes ?? ['any']).join(', ')})`)
  if (c.auth) meta.push(`**Auth collection** (login, email verification: ${c.auth.verify ? 'on' : 'off'})`)
  if (c.versions) meta.push(`**Drafts/versions:** ${c.versions.drafts ? 'drafts on' : 'versions'}`)
  if (c.timestamps !== false) meta.push('**Timestamps:** createdAt, updatedAt')
  const hooks = Object.entries(c.hooks ?? {}).filter(([, v]: any) => v?.length).map(([k, v]: any) => `${k} ×${v.length}`)
  if (hooks.length) meta.push(`**Hooks:** ${hooks.join(', ')}`)
  if (c.admin?.description) meta.push(`**Description:** ${short(String(c.admin.description), 300)}`)
  md += meta.map((m) => `- ${m}`).join('\n') + '\n\n'
  md += `**Access:** read — ${describeAccess(c.access?.read) || 'default (signed-in)'} · create — ${describeAccess(c.access?.create) || 'default'} · update — ${describeAccess(c.access?.update) || 'default'} · delete — ${describeAccess(c.access?.delete) || 'default'}\n\n`
  md += table(rows) + '\n'
}
md += `## 4. Globals\n\n`
for (const g of allGlobals) {
  const rows: Row[] = []
  walk(g.fields, '', rows)
  md += `### ${g.slug}\n\n- **Label:** ${typeof g.label === 'string' ? g.label : human(g.slug)}\n- **Access:** read — ${describeAccess(g.access?.read) || 'default'} · update — ${describeAccess(g.access?.update) || 'default'}\n\n` + table(rows) + '\n'
}
fs.mkdirSync('docs', { recursive: true })
fs.writeFileSync('docs/PAYLOAD-SCHEMA.md', md)
console.log('wrote docs/PAYLOAD-SCHEMA.md', md.length, 'chars,', md.split('\n').length, 'lines;', allCollections.length, 'collections,', allGlobals.length, 'globals')
process.exit(0)

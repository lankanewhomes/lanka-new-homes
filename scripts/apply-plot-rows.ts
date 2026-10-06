/* eslint-disable @typescript-eslint/no-explicit-any */
// Writes individual plot rows (lot number + size in perches) onto land listings, from block plans read by eye into JSON.
// Plans give no price and no sold/available label, so only name + sizePerches are written. Never overwrites a land that
// already has plot rows. Only "high" confidence reads are applied; medium/low are listed for review.
//   PLOTS_DIR=<scratchpad/plots> NODE_ENV=production npx tsx scripts/apply-plot-rows.ts [--apply] [--include-medium]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.PLOTS_DIR ?? ''
if (!dir) throw new Error('Set PLOTS_DIR')
const apply = process.argv.includes('--apply')
const includeMedium = process.argv.includes('--include-medium')

// Plots that are really reserves/open areas, per the readers' notes.
const EXCLUDE: Record<string, string[]> = { 'lush-dale-homagama': ['246'] }

// "1R-12.0P" / "01R 03.5P" / "01A-01R-3.5P" / "2R.36.33P": 1 acre = 4 roods = 160 perches, 1 rood = 40 perches.
function parseSizeText(text: string | null | undefined): number | null {
  if (!text) return null
  const m = text.replace(/[|]/g, ' ').match(/^\s*(?:(\d+)\s*A\W+)?(?:(\d+)\s*R\W+)?(\d+(?:\.\d+)?)\s*P?\s*$/i)
  if (!m || (m[1] === undefined && m[2] === undefined)) return null
  return Math.round(((Number(m[1] ?? 0) * 160) + (Number(m[2] ?? 0) * 40) + Number(m[3])) * 100) / 100
}

const research: Record<string, any> = {}
for (const f of fs.readdirSync(dir)) if (/^out-\d+\.json$/.test(f)) Object.assign(research, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))

const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const { createClient } = await import('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const held: string[] = []
let landsApplied = 0, plotsApplied = 0, converted = 0, unknownSize = 0
for (const [slug, r] of Object.entries(research)) {
  const plots: any[] = r.plots ?? []
  if (!plots.length) { held.push(`${slug}: no plots read (${r.confidence}) ${r.notes ?? ''}`.slice(0, 160)); continue }
  if (r.confidence !== 'high' && !(includeMedium && r.confidence === 'medium')) { held.push(`${slug}: ${r.confidence} confidence, ${plots.length} plots read: ${r.notes ?? ''}`.slice(0, 200)); continue }
  const land: any = (await payload.find({ collection: 'lands', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!land) { held.push(`${slug}: not found`); continue }
  if ((land.plots ?? []).length) { held.push(`${slug}: already has ${(land.plots ?? []).length} plot rows, left alone`); continue }
  const seen = new Set<string>()
  const rows = plots
    .filter((p) => !(EXCLUDE[slug] ?? []).includes(String(p.lot)))
    .map((p) => {
      let name = p.block ? `${p.lot} (${p.block})` : String(p.lot)
      if (seen.has(name)) name = `${name} (b)`
      seen.add(name)
      let size = typeof p.perches === 'number' && p.perches > 0 ? p.perches : null
      if (size === null) { const parsed = parseSizeText(p.sizeText); if (parsed) { size = parsed; converted++ } }
      if (size === null) unknownSize++
      return { name, sizePerches: size ?? 0 }
    })
  console.log(`${slug}: ${rows.length} plots${land.plotCount ? ` (stored count ${land.plotCount})` : ''}`)
  if (apply) {
    await payload.update({ collection: 'lands', id: land.id, data: { plots: rows } as any, overrideAccess: true })
    const { data } = await sb.from('lands').select('data').eq('slug', slug).single()
    if (((data as any)?.data?.plots ?? []).length !== rows.length) { await new Promise((res) => setTimeout(res, 1500)); console.log(`  !! Supabase shows ${(((data as any)?.data?.plots) ?? []).length} of ${rows.length}`) }
  }
  landsApplied++; plotsApplied += rows.length
}
console.log('\nHELD / SKIPPED:\n' + held.join('\n'))
console.log(`\n${apply ? 'APPLIED' : 'DRY RUN'}: ${landsApplied} lands, ${plotsApplied} plots; ${converted} sizes converted from roods/acres; ${unknownSize} plots with no readable size (stored as 0 = not shown)`)
process.exit(0)

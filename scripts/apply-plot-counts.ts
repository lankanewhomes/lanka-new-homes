/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script over researched JSON + arbitrary CMS docs */
// Sets Land.plotCount from the researched, developer-published plot counts (stated on the page, or counted from the
// numbered lots of the developer's own block plan). Only for lands with no plot rows and no plotCount yet. Default:
// HIGH confidence only; --medium also applies medium-confidence counts. Low-confidence and null results are skipped.
//   PLOTS_DIR=<scratchpad/plots> NODE_ENV=production npx tsx scripts/apply-plot-counts.ts [--apply]
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const dir = process.env.PLOTS_DIR ?? ''
if (!dir) throw new Error('Set PLOTS_DIR')
const apply = process.argv.includes('--apply')
const withMedium = process.argv.includes('--medium')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })

const research: Record<string, any> = {}
for (const f of fs.readdirSync(dir)) if (f.startsWith('out_') && f.endsWith('.json')) Object.assign(research, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
const tally: Record<string, number> = { applied: 0, skippedLowOrMedium: 0, skippedNull: 0, skippedHasData: 0, notFound: 0 }
let sum = 0
const lows: string[] = []
for (const [slug, r] of Object.entries(research)) {
  if (r.plotCount == null) { tally.skippedNull++; continue }
  if (r.confidence === 'low' || (r.confidence === 'medium' && !withMedium)) { tally.skippedLowOrMedium++; lows.push(`${slug}=${r.plotCount}(${r.confidence})`); continue }
  const d: any = (await payload.find({ collection: 'lands', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  if (!d) { tally.notFound++; continue }
  if ((d.plots ?? []).length || d.plotCount) { tally.skippedHasData++; continue }
  tally.applied++; sum += r.plotCount
  if (apply) await payload.update({ collection: 'lands', id: d.id, data: { plotCount: r.plotCount } as any, overrideAccess: true })
}
console.log(apply ? 'APPLIED' : 'DRY RUN', JSON.stringify(tally), '| plots added', sum, '| low-confidence skipped:', lows.join(', '))
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Owner 2026-11-22: "add hiriketiya". The developer's fractional page places Villa Senehasa in Hiriketiya (south coast).
// Idempotent. Changes only the location line, the summary's place list, the description's place sentence and one sentence in the fractional paragraph.
//   NODE_ENV=production npx tsx scripts/update-villa-senehasa-hiriketiya-2026-11-22.ts [--apply]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const apply = process.argv.includes('--apply')
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const p: any = await payload.findByID({ collection: 'projects', id: 44, depth: 0, overrideAccess: true })
const data: Record<string, any> = {}
if (!/Hiriketiya/.test(p.location ?? '')) data.location = 'Hiriketiya, South Coast, Sri Lanka'
if (!/Hiriketiya/.test(p.summary ?? '')) data.summary = String(p.summary).replace('(Ahangama, Weligama, or Mirissa)', '(Hiriketiya, Ahangama, Weligama, or Mirissa)')
if (!/Hiriketiya/.test(p.description ?? '')) {
  data.description = String(p.description)
    .replace('Weligama, or Mirissa (Matara District)', 'Weligama, Mirissa, or Hiriketiya (Matara District)')
    .replace('The villa is put up for sale in year 10.', 'The developer places the fractional villa in Hiriketiya. The villa is put up for sale in year 10.')
}
for (const [k, v] of Object.entries(data)) console.log(k, '->', k === 'description' ? (String(v).match(/[^.\n]*Hiriketiya[^.\n]*\./g) ?? []).join(' || ') : v)
if (!Object.keys(data).length) console.log('nothing to change')
if (apply && Object.keys(data).length) { await payload.update({ collection: 'projects', id: 44, data: data as never, overrideAccess: true }); console.log('saved') }
console.log(apply ? 'APPLIED' : 'DRY RUN')
process.exit(0)

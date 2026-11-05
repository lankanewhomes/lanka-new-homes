/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Fills listing_name / developer_name on leads that were created before those columns existed (land leads). Sends nothing.
//   NODE_ENV=production npx tsx scripts/_fill-lead-names.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const rows = await payload.find({ collection: 'leads', where: { listing_name: { exists: false } }, limit: 500, depth: 0, overrideAccess: true })
for (const lead of rows.docs as any[]) {
  const updated = await payload.update({ collection: 'leads', id: lead.id, data: { message: lead.message } as never, context: { skipLeadHooks: true, skipSupabaseSync: true, skipAnalytics: true }, overrideAccess: true }) as any
  console.log(lead.id, updated.listing_name, '|', updated.developer_name)
}
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Points the Isla Hokandara Social Posts rows (Instagram 27, Facebook 28) at the land listing. Running it in development
// with PAYLOAD_DB_PUSH=true also pushes the new social_posts.land column to Supabase:
//   PAYLOAD_DB_PUSH=true DATABASE_POOL_MAX=8 NODE_ENV=development npx tsx scripts/_set-land-on-social-posts.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const land = (await payload.find({ collection: 'lands', where: { slug: { equals: 'isla-hokandara' } }, limit: 1, depth: 0, overrideAccess: true } as any)).docs[0] as any
if (!land) throw new Error('land isla-hokandara missing')
for (const id of [27, 28]) {
  await payload.update({ collection: 'social-posts', id, data: { land: land.id } as any, overrideAccess: true })
  console.log('social post', id, '-> land', land.id)
}
process.exit(0)

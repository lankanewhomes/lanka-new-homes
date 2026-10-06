/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const [slugN, slugP] = process.argv.slice(2)
const n: any = (await payload.find({ collection: 'neighborhoods', where: { slug: { equals: slugN } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
const p: any = (await payload.find({ collection: 'projects', where: { slug: { equals: slugP } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
await payload.update({ collection: 'projects', id: p.id, data: { neighborhood: n.id, neighborhoodSlug: slugN } as any, overrideAccess: true })
console.log(slugP, '->', slugN, n.id); process.exit(0)

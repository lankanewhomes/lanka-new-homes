// Each John Keells Properties project publishes its own hotline (their site gives no
// separate WhatsApp number), so the listing's WhatsApp button uses that hotline.
//   NODE_ENV=production npx tsx scripts/set-jkp-whatsapp.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })
const LINES: Record<string, string> = {
  'vauxhall-dstrct': '+94711638638',
  'viman-ja-ela-apartments': '+94706062062',
  'cinnamon-life-apartments': '+94702151151',
  'tri-zen-apartments': '+94702294294',
}
for (const [slug, num] of Object.entries(LINES)) {
  const r = await payload.find({ collection: 'projects', where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: true })
  const d = r.docs[0] as unknown as { id: number; socialLinks?: Record<string, string | null> }
  await payload.update({ collection: 'projects', id: d.id, data: { socialLinks: { ...(d.socialLinks ?? {}), whatsapp: num } } as never, overrideAccess: true })
  console.log('set', slug, num)
}
process.exit(0)

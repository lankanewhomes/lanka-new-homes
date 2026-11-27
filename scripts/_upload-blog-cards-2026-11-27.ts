// Copies the illustration cards of two blog posts to R2:
//   blog/questions-to-ask-before-buying-a-home-in-sri-lanka/q-*.png  (5 questions + a meeting checklist)
//   blog/land-apartment-or-house-in-sri-lanka/land-*.png             (what you get, cost, work and risk, which suits you)
// The cards are made on the PC by C:\Users\rupan\lnh-reels\blog\make-cards.cjs + cards2.cjs (same style as the citizenship cards).
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_upload-blog-cards-2026-11-27.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const DIR = process.env.BLOG_CARDS_DIR || 'C:/Users/rupan/lnh-reels/blog/out'
const sets: Record<string, string[]> = {
  'questions-to-ask-before-buying-a-home-in-sri-lanka': ['q-deed', 'q-payments', 'q-build', 'q-finishes', 'q-late', 'q-checklist'],
  'land-apartment-or-house-in-sri-lanka': ['land-get', 'land-cost', 'land-work', 'land-suits'],
}
for (const [slug, names] of Object.entries(sets)) {
  for (const n of names) console.log(await mirrorToR2(`blog/${slug}/${n}.png`, fs.readFileSync(path.join(DIR, `${n}-v2.png`)), 'image/png'))
}
process.exit(0)

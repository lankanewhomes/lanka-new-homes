// Copies the six illustration cards of the dual citizenship article to R2 under blog/sri-lanka-dual-citizenship-new-rules-2026/.
// The cards are made on the PC by C:\Users\rupan\lnh-reels\blog\make-cards.cjs (same style as the land guide illustrations).
// File names end in -v2: the first set had type too small to read on a phone.
//   PowerShell:  $env:NODE_ENV='production'; npx tsx scripts/_upload-citizenship-blog-images.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const DIR = process.env.BLOG_CARDS_DIR || 'C:/Users/rupan/lnh-reels/blog/out'
for (const n of ['citizenship-changes', 'citizenship-home-buyers', 'citizenship-routes', 'citizenship-seven-ways', 'citizenship-fees', 'citizenship-steps']) {
  console.log(await mirrorToR2(`blog/sri-lanka-dual-citizenship-new-rules-2026/${n}-v2.png`, fs.readFileSync(path.join(DIR, `${n}-v2.png`)), 'image/png'))
}
process.exit(0)

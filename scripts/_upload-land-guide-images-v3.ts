/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Copies the extra illustrations for the land guide (one per section) to R2.
//   NODE_ENV=production npx tsx scripts/_upload-land-guide-images-v3.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/30-Article - Before buying land/blog-images'
for (const n of ['land-purpose', 'land-title', 'land-build', 'land-gated', 'land-shortlist']) {
  console.log(await mirrorToR2(`blog/before-buying-land-in-sri-lanka/${n}.png`, fs.readFileSync(path.join(DIR, `${n}.png`)), 'image/png'))
}
process.exit(0)

/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Copies the illustrations for the "How to choose the right LankaNewHomes package" blog post to R2 (blog/<slug>/<name>-t.png).
//   NODE_ENV=production npx tsx scripts/_upload-package-post-images.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const DIR = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/30-Article - Before buying land/blog-images/pkg'
for (const n of ['package-spots', 'package-swap', 'package-billing', 'package-campaign', 'package-free']) {
  console.log(await mirrorToR2(`blog/how-to-choose-the-right-lankanewhomes-package/${n}-t.png`, fs.readFileSync(path.join(DIR, `${n}-t.png`)), 'image/png'))
}
process.exit(0)

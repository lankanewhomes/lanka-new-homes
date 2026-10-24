/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// Copies the revised "documents" illustration (deed, survey plan, match to the land) for the land guide to R2.
//   NODE_ENV=production npx tsx scripts/_upload-land-guide-images-v2.ts
import fs from 'node:fs'
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const { mirrorToR2 } = await import('../src/lib/listing-import/mirror')
const f = '/Users/rupansinnarajah/Desktop/Stuff - LankaNewHomes/LankaNewHomes Social Posts/30-Article - Before buying land/blog-images/land-documents-v2.png'
console.log(await mirrorToR2('blog/before-buying-land-in-sri-lanka/land-documents-v2.png', fs.readFileSync(f), 'image/png'))
process.exit(0)

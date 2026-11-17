// Lists the files in R2 for listings: SLUGS=slug-a,slug-b [KIND=projects|lands] npx tsx scripts/_r2-list.ts
// Prints each key with its size so reels/carousels can use the biggest originals.
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const s3 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY! }, forcePathStyle: true })
const PUB = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '')
const kind = process.env.KIND ?? 'projects'
for (const slug of (process.env.SLUGS ?? '').split(',').filter(Boolean)) {
  let token: string | undefined
  do {
    const r: any = await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET!, Prefix: `${kind}/${slug}/`, ContinuationToken: token }))
    for (const o of r.Contents ?? []) console.log(`${o.Size}\t${PUB}/${o.Key}`)
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token)
}
process.exit(0)

import { s3Storage } from '@payloadcms/storage-s3'

// Cloudflare R2 for Payload's Media uploads (the "upload a file" option next
// to every URL field in /cms). R2 speaks S3, so this is Payload's official
// S3 plugin pointed at the account's R2 endpoint; files are served from the
// bucket's public URL (a custom domain like media.lankanewhomes.com, or the
// r2.dev subdomain) — never through the app.
//
// Five env vars (see docs/supabase-workflow.md "Media uploads (Cloudflare
// R2)"); while any is missing, payload.config.ts keeps the older Supabase
// Storage adapter so nothing breaks in an environment that hasn't been
// configured yet.
const env = {
  accountId: process.env.R2_ACCOUNT_ID ?? '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
  bucket: process.env.R2_BUCKET ?? '',
  publicUrl: (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, ''),
}

export function isR2Configured(): boolean {
  return Boolean(env.accountId && env.accessKeyId && env.secretAccessKey && env.bucket && env.publicUrl)
}

export function r2Storage() {
  return s3Storage({
    bucket: env.bucket,
    collections: {
      media: {
        // Files live only in R2, not also on local disk — required on
        // Vercel's read-only filesystem.
        disableLocalStorage: true,
        // CMS uploads sit under uploads/ so they never collide with the
        // curated project/logo folders (projects/<slug>/…, logos/…) that
        // were moved into the same bucket — see docs/supabase-workflow.md
        // "Media uploads (Cloudflare R2)".
        prefix: 'uploads',
        generateFileURL: ({ filename, prefix }) => `${env.publicUrl}/${[prefix, filename].filter(Boolean).join('/')}`,
      },
    },
    config: {
      endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
      // R2 ignores the region but the SDK insists on one.
      region: 'auto',
      credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
      // R2 requires path-style addressing.
      forcePathStyle: true,
    },
  })
}

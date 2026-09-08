// Regenerates src/app/(payload)/cms/importMap.js. `npx payload
// generate:importmap` hits a Node ESM/CJS interop error in this environment
// (ERR_REQUIRE_ASYNC_MODULE somewhere in the db-postgres/drizzle chain), so
// this calls the same underlying function directly via tsx instead.
//
// Loads .env.local first: payload.config registers the R2 storage plugin
// only when R2_* are set, and the plugin contributes
// `@payloadcms/storage-s3/client#S3ClientUploadHandler` to the map. Run
// without env, the generator drops that entry and the whole admin renders
// blank ("PayloadComponent not found in importMap") — happened 2026-09-08.
// Run with: npx tsx scripts/generate-payload-importmap.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

async function main() {
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error('R2_ACCESS_KEY_ID is not set — .env.local did not load, and the import map would lose the R2 upload handler.')
  }
  const { generateImportMap } = await import('payload')
  const config = await (await import('../payload.config')).default
  await generateImportMap(config, { log: true })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

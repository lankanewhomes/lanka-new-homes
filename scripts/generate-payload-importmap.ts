// Regenerates src/app/(payload)/payload-admin/importMap.js. `npx payload
// generate:importmap` hits a Node ESM/CJS interop error in this environment
// (ERR_REQUIRE_ASYNC_MODULE somewhere in the db-postgres/drizzle chain), so
// this calls the same underlying function directly via tsx instead.
// Run with: npx tsx scripts/generate-payload-importmap.ts
import { generateImportMap } from 'payload'
import configPromise from '../payload.config'

async function main() {
  const config = await configPromise
  await generateImportMap(config, { log: true })
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})

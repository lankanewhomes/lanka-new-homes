// One-time fix: Payload's JWT auth strategy (used on every request after
// login, including loading /cms itself) checks `user._verified` truthily —
// not the same `=== false` check the login *operation* uses. So an account
// created before auth.verify was turned on (where _verified was never set,
// i.e. null/undefined) could still log in, but every subsequent request
// got treated as logged-out and bounced back to /cms/login. Grandfathers
// in every account that existed before this feature shipped — they were
// already trusted; verification only needs to apply going forward.
//
// Run with: npx tsx scripts/backfill-verified.ts
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import type payloadConfigType from '../payload.config'

loadEnv({ path: path.join(process.cwd(), '.env.local') })

const payloadConfig = ((await import('../payload.config')) as { default: typeof payloadConfigType }).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: payloadConfig })

// Excludes the one account intentionally created after this feature shipped
// to test the real end-to-end verification flow with a real inbox — that
// one should stay genuinely pending, not get grandfathered in.
const EXCLUDE_EMAILS = ['sinnarajah.rupan@gmail.com']

const { docs: users } = await payload.find({ collection: 'users', limit: 1000, overrideAccess: true })

let updated = 0
for (const user of users) {
  if (EXCLUDE_EMAILS.includes(user.email)) {
    console.log(`Skipped (intentional pending-verification test): ${user.email}`)
    continue
  }
  if (user._verified !== true) {
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { _verified: true },
      overrideAccess: true,
    })
    console.log(`Verified: ${user.email} (was ${user._verified === false ? 'false' : 'unset'})`)
    updated++
  }
}

console.log(`\nDone. ${updated} of ${users.length} accounts updated.`)
process.exit(0)

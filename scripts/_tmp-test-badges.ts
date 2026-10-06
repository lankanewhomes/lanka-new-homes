/* eslint-disable @typescript-eslint/no-explicit-any */
// TEMPORARY: clones Prime Lands rows into 3 clearly-fake test developers + projects to screenshot the badge states.
// `create` | `delete`. Supabase-only rows (not in Payload).
import { config as loadEnv } from 'dotenv'; loadEnv({ path: '.env.local' })
const { createClient } = await import('@supabase/supabase-js')
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const STATES = [
  { key: 'verified', verified: true, paid: false },
  { key: 'featured', verified: false, paid: true },
  { key: 'both', verified: true, paid: true },
]
const mode = process.argv[2]
if (mode === 'delete') {
  for (const s of STATES) {
    await sb.from('projects').delete().eq('slug', `test-badge-${s.key}-project`)
    await sb.from('developers').delete().eq('slug', `test-badge-${s.key}-developer`)
  }
  console.log('deleted'); process.exit(0)
}
const { data: dev } = await sb.from('developers').select('*').eq('slug', 'prime-lands').single()
const { data: proj } = await sb.from('projects').select('*').eq('slug', 'prime-villas-dalugama').single()
for (const s of STATES) {
  const dslug = `test-badge-${s.key}-developer`, pslug = `test-badge-${s.key}-project`
  const dname = `TEST ${s.key} developer (delete me)`
  const dd = { ...dev!.data, slug: dslug, name: dname, website: 'https://www.testbadge.example', email: 'info@testbadge.example', plan: s.paid ? 'featured' : 'free', domainVerified: s.verified, verifiedDomain: s.verified ? 'testbadge.example' : undefined, respondsWithinHour: false }
  await sb.from('developers').upsert({ slug: dslug, name: dname, location: dev!.location, data: dd, verification_status: 'pending' })
  const pd = { ...proj!.data, slug: pslug, name: `TEST ${s.key} project (delete me)`, developerSlug: dslug, developerName: dname, package: s.paid ? 'featured' : 'free', isFeatured: false }
  const { error } = await sb.from('projects').upsert({ ...proj!, slug: pslug, name: pd.name, developer_slug: dslug, developer_name: dname, is_featured: false, data: pd, created_at: undefined, updated_at: undefined })
  console.log(s.key, error?.message ?? 'ok')
}
process.exit(0)

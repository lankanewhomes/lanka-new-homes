/* eslint-disable @typescript-eslint/no-explicit-any */
import path from 'node:path'
import { config as loadEnv } from 'dotenv'
loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const { supabaseAdmin } = await import('../src/lib/supabase')
const { data } = await supabaseAdmin.from('leads').select('*').in('project_slug', ['isuru-vimana-homagama', 'river-side-kaduwela', 'the-sequor-gampaha'])
for (const l of data ?? []) {
  const exists = await payload.find({ collection: 'leads', where: { supabase_lead_id: { equals: l.id } }, limit: 1, depth: 0, overrideAccess: true })
  if (exists.docs[0]) { console.log('already', l.id); continue }
  const land = (await payload.find({ collection: 'lands', where: { slug: { equals: l.project_slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  const created = await payload.create({
    collection: 'leads',
    data: { land: land.id, name: l.name, email: l.email, phone: l.phone, message: l.message, preferred_contact_method: l.preferred_contact_method, source: l.source, supabase_lead_id: l.id, createdAt: l.created_at } as never,
    context: { skipSupabaseSync: true, skipAnalytics: true, skipLeadHooks: true },
    overrideAccess: true,
  })
  console.log('created', created.id, l.project_slug)
}
process.exit(0)

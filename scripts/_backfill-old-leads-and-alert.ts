/* eslint-disable @typescript-eslint/no-explicit-any -- one-off script */
// 2026-11-04: copies the Supabase leads that never reached the backend into Payload (silently, no alerts). With --send it also
// sends the developer alerts for the three real land leads (ids 52, 53, 54) and the River Side brochure email to its buyer.
//   LEAD_ALERTS_LIVE=true NODE_ENV=production npx tsx scripts/_backfill-old-leads-and-alert.ts [--send]
import path from 'node:path'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env.local') })
const cfg = ((await import('../payload.config')) as any).default
const { getPayload } = await import('payload')
const payload = await getPayload({ config: cfg })
const { supabaseAdmin } = await import('../src/lib/supabase')

// Only the three real land leads: the early-September test leads are deliberately not copied (owner, 2026-11-04).
const { data: rows } = await supabaseAdmin.from('leads').select('*').in('project_slug', ['isuru-vimana-homagama', 'river-side-kaduwela', 'the-sequor-gampaha']).order('created_at')
for (const l of rows ?? []) {
  const exists = await payload.find({ collection: 'leads', where: { supabase_lead_id: { equals: l.id } }, limit: 1, depth: 0, overrideAccess: true })
  if (exists.docs[0]) continue
  const project = (await payload.find({ collection: 'projects', where: { slug: { equals: l.project_slug } }, limit: 1, depth: 0, overrideAccess: true })).docs[0]
  const created = await payload.create({
    collection: 'leads',
    data: { ...(project ? { project: project.id } : {}), name: l.name, email: l.email, phone: l.phone, message: l.message, preferred_contact_method: l.preferred_contact_method, source: l.source, supabase_lead_id: l.id } as never,
    context: { skipSupabaseSync: true, skipAnalytics: true, skipLeadHooks: true },
    overrideAccess: true,
  })
  console.log('backfilled', created.id, l.project_slug)
}

if (!process.argv.includes('--send')) {
  console.log('backfill only; pass --send to email the developers')
  process.exit(0)
}

const { sendLeadAlerts } = await import('../src/lib/lead-alerts')
const { renderBrochureEmailHTML } = await import('../src/lib/brochure-email')
for (const id of [52, 53, 54]) {
  const lead = await payload.findByID({ collection: 'leads', id, depth: 0, overrideAccess: true })
  const outcome = await sendLeadAlerts(payload, lead as any, { skipBuyer: true })
  console.log('alert', id, JSON.stringify(outcome))
}

const river = (await payload.find({ collection: 'lands', where: { slug: { equals: 'river-side-kaduwela' } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as any
const brochureUrl = typeof river?.brochureUrl === 'string' ? river.brochureUrl : ''
console.log('river brochure', brochureUrl || 'none')
if (brochureUrl) {
  await payload.sendEmail({
    to: 'sachithmadusanka668@gmail.com',
    from: process.env.EMAIL_FROM,
    subject: `Your ${river.title} brochure`,
    html: renderBrochureEmailHTML({ projectName: String(river.title), brochureUrl }),
    text: `Here's your brochure for ${river.title}: ${brochureUrl}`,
  })
  console.log('brochure emailed')
}
process.exit(0)

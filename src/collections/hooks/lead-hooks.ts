import type { CollectionAfterChangeHook } from 'payload'
import { supabaseAdmin } from '@/lib/supabase'
import { sendLeadAlerts } from '@/lib/lead-alerts'
import { recomputeDeveloperResponseStats } from '@/lib/response-badge'

function relId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

// Lead status values in Payload → the label stored on the Supabase `leads`
// row the buyer sees under Account → My enquiries.
export const SUPABASE_LEAD_STATUS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit: 'Site visit',
  closed: 'Closed',
}

// Instant email + WhatsApp alert to the developer (src/lib/lead-alerts.ts).
// Runs on create only, after the row is committed, and never throws.
export const notifyDeveloperOfLead: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create' || req.context?.skipLeadHooks) return doc
  try {
    await sendLeadAlerts(req.payload, doc)
  } catch (error) {
    req.payload.logger.error({ err: error, leadId: doc.id }, 'Lead alert failed')
  }
  return doc
}

// Response-time tracking: the first time a lead leaves "New", stamp when
// and how many minutes after it came in. Written with overrideAccess so the
// admin-only field access on these two fields still keeps developers from
// editing them by hand (the badge "responds within 1 hour" will be built on
// them). The nested update sets skipLeadHooks so this doesn't re-enter.
export const stampFirstResponse: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || req.context?.skipLeadHooks) return doc
  if (doc.status === 'new' || doc.first_response_at || previousDoc?.status !== 'new') return doc
  const createdAt = typeof doc.createdAt === 'string' ? new Date(doc.createdAt) : new Date()
  const now = new Date()
  const response_minutes = Math.max(0, Math.round((now.getTime() - createdAt.getTime()) / 60_000))
  await req.payload.update({
    collection: 'leads',
    id: doc.id,
    data: { first_response_at: now.toISOString(), response_minutes },
    overrideAccess: true,
    context: { skipLeadHooks: true, skipSupabaseSync: true },
    req,
  })
  // A reply changes the developer's "Responds within 1 hour" standing.
  try {
    const projectId = relId(doc.project)
    const project = projectId ? await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req }) : null
    const developerId = relId(project?.developer)
    if (developerId) await recomputeDeveloperResponseStats(req.payload, developerId)
  } catch (error) {
    req.payload.logger.error({ err: error, leadId: doc.id }, 'Response badge recompute failed')
  }
  return { ...doc, first_response_at: now.toISOString(), response_minutes }
}

// Keep the buyer's copy in step: when the developer moves a lead along the
// pipeline, mirror the status onto the Supabase row (linked by
// supabase_lead_id, which the /api/leads route and the create-sync set).
export const syncLeadStatusToSupabase: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update' || req.context?.skipLeadHooks) return doc
  const supabaseId = typeof doc.supabase_lead_id === 'string' ? doc.supabase_lead_id : ''
  if (!supabaseId || doc.status === previousDoc?.status) return doc
  const status = SUPABASE_LEAD_STATUS[String(doc.status)]
  if (!status) return doc
  const { error } = await supabaseAdmin.from('leads').update({ status }).eq('id', supabaseId)
  if (error) req.payload.logger.error({ leadId: doc.id, supabaseId, error: error.message }, 'Lead status sync to Supabase failed')
  return doc
}

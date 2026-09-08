// Instant lead alerts — the moment a lead is created in Payload (Request
// info, brochure request, or added by hand in /cms), email the project's
// developer and, when the WhatsApp Business API is connected, send them a
// WhatsApp template message too. Both carry the project (and floor plan,
// when the buyer asked from a plan page), the buyer's details and one-tap
// reply links. Failures are logged, never thrown — a lead must never be
// lost because an alert could not be delivered.
//
// Recipients come from the developer record: Lead alerts → Alert email
// (fallback: Contact Email, then the linked account's login email) and
// Lead alerts → Alert WhatsApp number (fallback: Social Links → WhatsApp).
// Set LEAD_ALERTS_OVERRIDE_TO / LEAD_ALERTS_OVERRIDE_WHATSAPP to route every
// alert to a test inbox / number instead (staging, dry runs).

import type { Payload } from 'payload'
import { renderLeadAlertEmailHTML } from '@/lib/lead-alert-email'
import { buyerWhatsAppMessage, toWhatsAppNumber, whatsappChatHref } from '@/lib/whatsapp'
import { isWhatsAppCloudConfigured, sendWhatsAppTemplate } from '@/lib/whatsapp-cloud'

type AnyDoc = Record<string, unknown>

export type LeadLike = {
  id: string | number
  project?: unknown
  name?: unknown
  email?: unknown
  phone?: unknown
  message?: unknown
  source?: unknown
  preferred_contact_method?: unknown
  floor_plan?: unknown
  createdAt?: unknown
}

export type LeadAlertOutcome = {
  email: 'sent' | 'skipped' | 'failed'
  whatsapp: 'sent' | 'skipped' | 'failed'
  to: { email: string | null; whatsapp: string | null }
  detail?: string
}

const SOURCE_LABEL: Record<string, string> = {
  request_info: 'New inquiry',
  brochure_request: 'Brochure request',
  manual: 'New lead',
}

function relId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

export async function sendLeadAlerts(payload: Payload, lead: LeadLike): Promise<LeadAlertOutcome> {
  const outcome: LeadAlertOutcome = { email: 'skipped', whatsapp: 'skipped', to: { email: null, whatsapp: null } }

  const projectId = relId(lead.project)
  if (!projectId) return { ...outcome, detail: 'lead has no project' }
  const project = (await payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true })) as unknown as AnyDoc | null
  if (!project) return { ...outcome, detail: 'project not found' }

  const developerId = relId(project.developer)
  const developer = developerId ? ((await payload.findByID({ collection: 'developers', id: developerId, depth: 0, overrideAccess: true })) as unknown as AnyDoc | null) : null
  if (!developer) return { ...outcome, detail: 'project has no developer' }

  const alerts = (developer.lead_alerts as AnyDoc | undefined) ?? {}
  if (alerts.enabled === false) return { ...outcome, detail: 'alerts disabled for developer' }

  // Recipients.
  let alertEmail = text(alerts.email) || text(developer.contact_email)
  if (!alertEmail) {
    const userId = relId(developer.user)
    if (userId) {
      const user = (await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true }).catch(() => null)) as AnyDoc | null
      alertEmail = text(user?.email)
    }
  }
  const social = (developer.socialLinks as AnyDoc | undefined) ?? {}
  let alertWhatsApp = toWhatsAppNumber(text(alerts.whatsapp) || text(social.whatsapp))
  if (process.env.LEAD_ALERTS_OVERRIDE_TO) alertEmail = process.env.LEAD_ALERTS_OVERRIDE_TO
  if (process.env.LEAD_ALERTS_OVERRIDE_WHATSAPP) alertWhatsApp = toWhatsAppNumber(process.env.LEAD_ALERTS_OVERRIDE_WHATSAPP)
  outcome.to = { email: alertEmail || null, whatsapp: alertWhatsApp }

  // Content shared by both channels.
  const projectName = text(project.name) || 'your project'
  const planName = text(lead.floor_plan) || null
  const sourceLabel = SOURCE_LABEL[text(lead.source)] ?? SOURCE_LABEL.request_info
  const buyerName = text(lead.name) || 'A buyer'
  const buyerPhone = text(lead.phone) || null
  const buyerEmail = text(lead.email) || null
  const preferred = text(lead.preferred_contact_method) || null
  const message = text(lead.message) || null
  const receivedAt = typeof lead.createdAt === 'string' ? new Date(lead.createdAt) : new Date()
  const serverURL = payload.config.serverURL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lankanewhomes.com'
  const dashboardPath = `collections/leads/${lead.id}`
  const dashboardUrl = `${serverURL}/cms/${dashboardPath}`
  const replyOpener = `Hi ${buyerName}, thanks for your interest in ${planName ? `${planName} at ` : ''}${projectName}. `
  const whatsappHref = whatsappChatHref(buyerPhone, replyOpener)

  // Email.
  if (alertEmail) {
    try {
      await payload.sendEmail({
        to: alertEmail,
        from: process.env.EMAIL_FROM,
        subject: `${sourceLabel}: ${planName ? `${planName} · ` : ''}${projectName} — ${buyerName}${buyerPhone ? ` (${buyerPhone})` : ''}`,
        html: renderLeadAlertEmailHTML({ projectName, planName, sourceLabel, buyerName, buyerPhone, buyerEmail, preferredContact: preferred, message, receivedAt, whatsappHref, dashboardUrl }),
      })
      outcome.email = 'sent'
    } catch (error) {
      outcome.email = 'failed'
      payload.logger.error({ err: error, leadId: lead.id }, 'Lead alert email failed')
    }
  }

  // WhatsApp (template message — see docs/design.md "Lead alerts").
  if (alertWhatsApp && isWhatsAppCloudConfigured()) {
    const result = await sendWhatsAppTemplate({
      to: alertWhatsApp,
      bodyParams: [
        planName ? `${planName} at ${projectName}` : projectName,
        buyerName,
        buyerPhone ?? buyerEmail ?? '-',
        preferred ?? 'Any',
        message ?? buyerWhatsAppMessage(projectName, planName),
      ],
      buttonUrlSuffix: dashboardPath,
    })
    if (result.ok) {
      outcome.whatsapp = 'sent'
    } else {
      outcome.whatsapp = 'failed'
      payload.logger.error({ leadId: lead.id, error: result.error }, 'Lead alert WhatsApp failed')
    }
  }

  payload.logger.info({ leadId: lead.id, email: outcome.email, whatsapp: outcome.whatsapp }, 'Lead alert')
  return outcome
}

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
//
// Test routing — so a trial inquiry can never reach a real developer
// (resolveLeadAlertRouting): the email is redirected to the test inbox and
// WhatsApp is skipped when
//   • this isn't the production deployment (local dev, Vercel preview;
//     VERCEL_ENV !== 'production', unless LEAD_ALERTS_LIVE=true),
//   • the admin switch Lead alert settings → Mode is "Test",
//   • the lead's email belongs to an admin account, or is on a known test
//     domain (resend.dev, example.com, …),
//   • LEAD_ALERTS_OVERRIDE_TO is set (goes there instead; overrides all).
// The test inbox is Lead alert settings → Test inbox, else
// LEAD_ALERTS_TEST_INBOX, else delivered@resend.dev (accepts + discards).

import type { Payload, PayloadRequest } from 'payload'
import { renderLeadAlertEmailHTML } from '@/lib/lead-alert-email'
import { leadReplyUrl } from '@/lib/lead-reply-links'
import { buyerWhatsAppMessage, toWhatsAppNumber } from '@/lib/whatsapp'
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
  /** 'live' = the developer; otherwise why the alert was redirected. */
  routing: LeadAlertRouting['reason']
  detail?: string
}

export type LeadAlertRouting =
  | { mode: 'live'; reason: 'live' }
  | { mode: 'test'; reason: 'non-production' | 'settings-test-mode' | 'test-email' | 'admin-email' | 'env-override'; testInbox: string }

const TEST_EMAIL_DOMAINS = new Set(['resend.dev', 'example.com', 'example.org', 'example.net', 'test.com', 'mailinator.com', 'localhost'])
const DEFAULT_TEST_INBOX = 'delivered@resend.dev'

function isProductionDeployment(): boolean {
  if (process.env.LEAD_ALERTS_LIVE === 'true') return true
  return process.env.VERCEL_ENV === 'production'
}

/** Decide whether this lead's alert may reach the real developer. */
export async function resolveLeadAlertRouting(payload: Payload, buyerEmail: string | null): Promise<LeadAlertRouting> {
  const settings = (await payload.findGlobal({ slug: 'lead-alert-settings', depth: 0, overrideAccess: true }).catch(() => null)) as AnyDoc | null
  const testInbox = process.env.LEAD_ALERTS_OVERRIDE_TO || text(settings?.testInbox) || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX

  if (process.env.LEAD_ALERTS_OVERRIDE_TO) return { mode: 'test', reason: 'env-override', testInbox }
  if (!isProductionDeployment()) return { mode: 'test', reason: 'non-production', testInbox }
  if (settings?.mode === 'test') return { mode: 'test', reason: 'settings-test-mode', testInbox }

  const email = (buyerEmail ?? '').trim().toLowerCase()
  if (email) {
    const domain = email.split('@')[1] ?? ''
    if (TEST_EMAIL_DOMAINS.has(domain)) return { mode: 'test', reason: 'test-email', testInbox }
    const admins = await payload.find({ collection: 'users', where: { and: [{ email: { equals: email } }, { role: { equals: 'admin' } }] }, limit: 1, depth: 0, overrideAccess: true })
    if (admins.totalDocs > 0) return { mode: 'test', reason: 'admin-email', testInbox }
  }
  return { mode: 'live', reason: 'live' }
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

// `req` matters when called from the Leads afterChange hook: the lead row is
// still inside that request's transaction, so the alert-log write below
// must ride the same request or it can't see the row (Postgres).
export async function sendLeadAlerts(payload: Payload, lead: LeadLike, opts: { req?: PayloadRequest } = {}): Promise<LeadAlertOutcome> {
  const routing = await resolveLeadAlertRouting(payload, text(lead.email) || null)
  const outcome: LeadAlertOutcome = { email: 'skipped', whatsapp: 'skipped', to: { email: null, whatsapp: null }, routing: routing.reason }

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
  // Test routing: the developer's address is replaced by the test inbox and
  // WhatsApp is dropped (a WhatsApp override number is the one exception).
  if (routing.mode === 'test') {
    alertEmail = routing.testInbox
    alertWhatsApp = process.env.LEAD_ALERTS_OVERRIDE_WHATSAPP ? toWhatsAppNumber(process.env.LEAD_ALERTS_OVERRIDE_WHATSAPP) : null
  }
  outcome.to = { email: alertEmail || null, whatsapp: alertWhatsApp }
  const subjectPrefix = routing.mode === 'test' ? `[TEST — not sent to ${text(developer.name) || 'the developer'}] ` : ''

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
  // One-tap reply links: tapping marks the lead answered, then forwards
  // (src/lib/lead-reply-links.ts + /api/leads/reply).
  const replyLinks = {
    whatsapp: toWhatsAppNumber(buyerPhone) ? leadReplyUrl(serverURL, lead.id, 'whatsapp') : null,
    call: buyerPhone ? leadReplyUrl(serverURL, lead.id, 'call') : null,
    email: buyerEmail ? leadReplyUrl(serverURL, lead.id, 'email') : null,
  }

  // Email.
  if (alertEmail) {
    try {
      await payload.sendEmail({
        to: alertEmail,
        from: process.env.EMAIL_FROM,
        subject: `${subjectPrefix}${sourceLabel}: ${planName ? `${planName} · ` : ''}${projectName} — ${buyerName}${buyerPhone ? ` (${buyerPhone})` : ''}`,
        html: renderLeadAlertEmailHTML({ projectName, planName, sourceLabel, buyerName, buyerPhone, buyerEmail, preferredContact: preferred, message, receivedAt, replyLinks, dashboardUrl }),
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

  // Leave a trail on the lead for the admin "Lead activity" page.
  const at = new Date().toISOString()
  const alertLog = [
    { channel: 'email', to: alertEmail || '-', status: alertEmail ? outcome.email : 'skipped (no address)', routing: routing.reason, at },
    ...(alertWhatsApp ? [{ channel: 'whatsapp', to: alertWhatsApp, status: isWhatsAppCloudConfigured() ? outcome.whatsapp : 'skipped (API not configured)', routing: routing.reason, at }] : []),
  ]
  const summary = alertEmail
    ? `Email ${outcome.email} → ${alertEmail}${routing.mode === 'test' ? ` (TEST: ${routing.reason})` : ''}${alertWhatsApp && outcome.whatsapp === 'sent' ? ' · WhatsApp sent' : ''}`
    : 'No alert — developer has no email'
  try {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { alert_log: alertLog, alert_summary: summary } as never,
      overrideAccess: true,
      context: { skipLeadHooks: true, skipSupabaseSync: true },
      req: opts.req,
    })
  } catch (error) {
    payload.logger.error({ err: error, leadId: lead.id }, 'Could not record lead alert log')
  }

  payload.logger.info({ leadId: lead.id, routing: routing.reason, to: outcome.to.email, email: outcome.email, whatsapp: outcome.whatsapp }, 'Lead alert')
  return outcome
}

import type { Payload } from 'payload'
import { resolveLeadAlertRouting } from '@/lib/lead-alerts'
import { leadReminderSubject, renderLeadReminderEmailHTML } from '@/lib/lead-reminder-email'
import { leadReplyUrl } from '@/lib/lead-reply-links'
import { toWhatsAppNumber } from '@/lib/whatsapp'

// Reminder emails for buyer enquiries nobody has answered (owner, 2026-10-21: "reminder email, that's smart"). A lead counts as unanswered
// while its status is still "New" and no reply button in the alert was tapped. The developer gets a reminder 12 hours after the enquiry and a
// last one at 48 hours, only between 08:00 and 20:00 Sri Lanka time. Same recipients as the instant alert (including an agency that handles
// the sale). Test leads are never reminded. Nothing is emailed unless LEAD_REMINDERS_ENABLED=true; otherwise this only reports what it would send.
// Run from the lead-alert-sweep cron (every 10 minutes).

type AnyDoc = Record<string, unknown>
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')
const relId = (v: unknown) => (v && typeof v === 'object' && 'id' in v ? (v as { id: string | number }).id : (v as string | number | undefined))

/** Hours after the enquiry at which reminder 1, 2… go out. */
export const REMINDER_AFTER_HOURS = [12, 48]
const SEND_FROM_HOUR = 8
const SEND_UNTIL_HOUR = 20
const BATCH = 10

const colomboHour = (d: Date) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Colombo', hour: '2-digit', hour12: false }).format(d)) % 24

export type ReminderResult = { id: string | number; reminder: number; to?: string; status: 'sent' | 'would-send' | 'skipped' | 'failed'; why?: string }

export async function sendLeadReminders(payload: Payload, opts: { now?: Date; enabled?: boolean } = {}): Promise<{ enabled: boolean; checked: number; results: ReminderResult[] }> {
  const now = opts.now ?? new Date()
  const enabled = opts.enabled ?? process.env.LEAD_REMINDERS_ENABLED === 'true'
  const results: ReminderResult[] = []
  const hour = colomboHour(now)
  if (hour < SEND_FROM_HOUR || hour >= SEND_UNTIL_HOUR) return { enabled, checked: 0, results }

  const found = await payload.find({
    collection: 'leads',
    where: {
      and: [
        { status: { equals: 'new' } },
        { createdAt: { greater_than: new Date(now.getTime() - 5 * 24 * 3600 * 1000).toISOString() } },
        { createdAt: { less_than: new Date(now.getTime() - REMINDER_AFTER_HOURS[0] * 3600 * 1000).toISOString() } },
        { alert_summary: { exists: true } },
      ],
    },
    sort: 'createdAt',
    limit: 50,
    depth: 0,
    overrideAccess: true,
  })

  let handled = 0
  for (const lead of found.docs as unknown as AnyDoc[]) {
    if (handled >= BATCH) break
    const id = lead.id as string | number
    const done = Number(lead.reminder_count) || 0
    const next = done + 1
    const afterHours = REMINDER_AFTER_HOURS[done]
    if (afterHours === undefined) continue
    const created = new Date(String(lead.createdAt))
    const hoursWaiting = (now.getTime() - created.getTime()) / 3600000
    if (hoursWaiting < afterHours) continue
    if (lead.first_response_at || (Array.isArray(lead.reply_events) && lead.reply_events.length)) continue
    // A reminder for the same lead is never sent twice within 6 hours (a missed cron run must not double up).
    if (lead.last_reminder_at && now.getTime() - new Date(String(lead.last_reminder_at)).getTime() < 6 * 3600 * 1000) continue

    const routing = await resolveLeadAlertRouting(payload, text(lead.email) || null)
    if (routing.mode === 'test') { results.push({ id, reminder: next, status: 'skipped', why: `test lead (${routing.reason})` }); continue }

    const projectId = relId(lead.project)
    const project = projectId ? ((await payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as AnyDoc | null) : null
    if (!project) { results.push({ id, reminder: next, status: 'skipped', why: 'no project' }); continue }
    const developerId = relId(project.developer)
    const developerDoc = developerId ? ((await payload.findByID({ collection: 'developers', id: developerId, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as AnyDoc | null) : null
    if (!developerDoc) { results.push({ id, reminder: next, status: 'skipped', why: 'no developer' }); continue }

    // Same "Leads go to" routing as the instant alert (docs/lead-routing.md).
    const leadsTo = text(project.leadsTo)
    const companyCollection = leadsTo === 'Marketing company' ? 'marketing-companies' : leadsTo === 'Sales company' ? 'sales-companies' : null
    const companyId = relId(leadsTo === 'Marketing company' ? project.marketing_company : leadsTo === 'Sales company' ? project.sales_company : null)
    const companyDoc = companyCollection && companyId ? ((await payload.findByID({ collection: companyCollection, id: companyId, depth: 0, overrideAccess: true }).catch(() => null)) as unknown as AnyDoc | null) : null
    const recipient = companyDoc && text(companyDoc.contact_email) ? companyDoc : developerDoc
    const alerts = (recipient.lead_alerts as AnyDoc | undefined) ?? {}
    if (alerts.enabled === false) { results.push({ id, reminder: next, status: 'skipped', why: 'alerts disabled for developer' }); continue }
    let to = text(alerts.email) || text(recipient.contact_email)
    if (!to) {
      const userId = relId(recipient.user)
      const user = userId ? ((await payload.findByID({ collection: 'users', id: userId, depth: 0, overrideAccess: true }).catch(() => null)) as AnyDoc | null) : null
      to = text(user?.email)
    }
    if (!to) { results.push({ id, reminder: next, status: 'skipped', why: 'no address' }); continue }
    const cc = Array.from(new Set(
      [text((developerDoc.lead_alerts as AnyDoc | undefined)?.email) || text(developerDoc.contact_email), text((project.contact as AnyDoc | undefined)?.email), ...(Array.isArray(alerts.cc) ? (alerts.cc as unknown[]).map(text) : [])]
        .map((a) => a.trim().toLowerCase())
        .filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a) && a !== to.toLowerCase()),
    ))

    handled++
    if (!enabled) { results.push({ id, reminder: next, to, status: 'would-send' }); continue }

    const serverURL = payload.config.serverURL || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lankanewhomes.com'
    const buyerPhone = text(lead.phone) || null
    const buyerEmail = text(lead.email) || null
    const input = {
      number: next,
      hoursWaiting,
      projectName: text(project.name) || 'your project',
      planName: text(lead.floor_plan) || null,
      buyerName: text(lead.name) || 'A buyer',
      buyerPhone,
      buyerEmail,
      preferredContact: text(lead.preferred_contact_method) || null,
      message: text(lead.message) || null,
      receivedAt: created,
      replyLinks: {
        whatsapp: toWhatsAppNumber(buyerPhone) ? leadReplyUrl(serverURL, id, 'whatsapp') : null,
        call: buyerPhone ? leadReplyUrl(serverURL, id, 'call') : null,
        email: buyerEmail ? leadReplyUrl(serverURL, id, 'email') : null,
      },
      dashboardUrl: `${serverURL}/cms/collections/leads/${id}`,
    }
    try {
      await payload.sendEmail({ to, ...(cc.length ? { cc } : {}), from: process.env.EMAIL_FROM, subject: leadReminderSubject(input), html: renderLeadReminderEmailHTML(input) })
      await payload.update({ collection: 'leads', id, data: { reminder_count: next, last_reminder_at: now.toISOString() } as never, overrideAccess: true, context: { skipLeadHooks: true, skipSupabaseSync: true } } as never)
      results.push({ id, reminder: next, to, status: 'sent' })
    } catch (error) {
      payload.logger.error({ err: error, leadId: id }, 'Lead reminder email failed')
      results.push({ id, reminder: next, to, status: 'failed' })
    }
  }
  return { enabled, checked: found.docs.length, results }
}

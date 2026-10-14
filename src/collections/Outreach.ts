import crypto from 'node:crypto'
import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'
import { OUTREACH_SENDERS, OUTREACH_TEMPLATES } from '../lib/outreach-templates'

// Always the public domain: these links are pasted into real emails, even when the row is created from a local session.
const SITE = 'https://www.lankanewhomes.com'

// Pages every outreach email can point at. Each becomes a tracked link (…/o/<code>?to=<path>) that records the click, then redirects.
const BASE_LINKS: { label: string; path: string }[] = [
  { label: 'Sign in', path: '/developers/login' },
  { label: 'Create an account', path: '/developers/register' },
  { label: 'Dashboard (Verified Developer panel + project fields)', path: '/cms' },
]

// Owner's log of emails sent to developers (owner, 2026-10-12). Emails typed in Zoho Mail are invisible to Resend, so each one is
// logged here by hand (developer, subject, date); the tracked links this row generates are pasted into the email, and every click
// on them is recorded automatically by the /o/<code> route. Payload-only: internal, never read by the public site.
export const Outreach: CollectionConfig = {
  slug: 'outreach',
  labels: { singular: 'Outreach email', plural: 'Outreach log' },
  defaultSort: '-sentAt',
  admin: {
    group: 'Leads & Engagement',
    useAsTitle: 'subject',
    defaultColumns: ['developerName', 'subject', 'sentAt', 'status', 'clickCount'],
    // Retired from the CMS menu (owner, 2026-10-14): emails to developers are written in /cms/mail and shown on each developer's Emails tab.
    // The collection, its rows and the /o/<code> tracked links stay, so old emails keep counting clicks.
    hidden: true,
    components: { beforeListTable: ['@/components/payload/OutreachStats#OutreachStats'] },
    description: 'Emails you send to developers. Add a row for each email, copy its tracked links into the email, and clicks are counted here.',
  },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const next = { ...data }
        const code: string = next.code || originalDoc?.code || crypto.randomBytes(5).toString('hex')
        next.code = code

        const devId = next.developer ?? originalDoc?.developer
        if (devId) {
          try {
            const dev = await req.payload.findByID({ collection: 'developers', id: typeof devId === 'object' ? devId.id : devId, depth: 0, select: { name: true }, req })
            next.developerName = (dev as { name?: string }).name ?? ''
          } catch {
            /* keep the previous name */
          }
        }

        const links = [...BASE_LINKS]
        const projectIds: (number | { id: number })[] = next.projects ?? originalDoc?.projects ?? []
        for (const raw of projectIds) {
          try {
            const project = await req.payload.findByID({ collection: 'projects', id: typeof raw === 'object' ? raw.id : raw, depth: 0, select: { name: true, slug: true }, req })
            const p = project as { name?: string; slug?: string }
            if (p.slug) links.push({ label: p.name ?? p.slug, path: `/projects/${p.slug}` })
          } catch {
            /* skip a project that no longer exists */
          }
        }
        next.trackedLinks = links.map((l) => `${l.label}: ${SITE}/o/${code}?to=${l.path}`).join('\n')
        return next
      },
    ],
  },
  fields: [
    // Two tabs (owner, 2026-10-12: "redesign the outreach better and user friendly"): write and send on one, see what happened on the other.
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Write & send',
          fields: [
            { name: 'summary', type: 'ui', admin: { components: { Field: '@/components/payload/OutreachSummary#OutreachSummary' } } },
            // The composer (OutreachComposer) draws one friendly screen for these seven fields and writes to them with useField;
            // the plain Payload inputs are hidden so nothing shows twice.
            { name: 'developer', type: 'relationship', relationTo: 'developers', index: true, admin: { hidden: true } },
            { name: 'projects', type: 'relationship', relationTo: 'projects', hasMany: true, admin: { hidden: true } },
            { name: 'lead', type: 'relationship', relationTo: 'leads', admin: { hidden: true } },
            { name: 'template', type: 'select', options: OUTREACH_TEMPLATES.map((t) => ({ label: t.label, value: t.id })), admin: { hidden: true } },
            { name: 'contactName', type: 'text', admin: { hidden: true } },
            { name: 'toEmail', type: 'email', admin: { hidden: true } },
            { name: 'fromAddress', type: 'select', defaultValue: 'developers@lankanewhomes.com', options: OUTREACH_SENDERS.map((s) => ({ label: s.label, value: s.value })), admin: { hidden: true } },
            { name: 'customNote', type: 'textarea', admin: { hidden: true } },
            { name: 'composer', type: 'ui', admin: { components: { Field: '@/components/payload/OutreachComposer#OutreachComposer' } } },
          ],
        },
        {
          label: 'Results & details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'status',
                  type: 'select',
                  defaultValue: 'draft',
                  index: true,
                  options: [
                    { label: 'Draft (not sent yet)', value: 'draft' },
                    { label: 'Sent', value: 'sent' },
                    { label: 'Clicked a link', value: 'clicked' },
                    { label: 'Replied', value: 'replied' },
                    { label: 'No reply', value: 'no_reply' },
                  ],
                  admin: { description: 'Updates itself on send and on click. Change it by hand for Replied / No reply.', width: '50%', components: { Cell: '@/components/payload/OutreachCells#OutreachStatusCell' } },
                },
                { name: 'sentAt', type: 'date', label: 'Sent on', defaultValue: () => new Date().toISOString(), index: true, admin: { date: { pickerAppearance: 'dayAndTime' }, width: '50%' } },
              ],
            },
            {
              name: 'channel',
              type: 'select',
              defaultValue: 'zoho',
              options: [
                { label: 'Zoho Mail (typed by hand)', value: 'zoho' },
                { label: 'Resend (sent from here)', value: 'resend' },
              ],
              admin: { description: 'Emails sent from this screen are marked Resend. Pick Zoho for emails you typed in Zoho Mail and logged here by hand.' },
            },
            { name: 'subject', type: 'text', admin: { description: 'Filled in from the template when you send. Type one yourself for emails you send from Zoho.' } },
            { name: 'recipient', type: 'text', label: 'Sent to', admin: { description: 'Filled in automatically when you send from here. For Zoho emails type e.g. "Erwan (contact@maisonceylon.com)".' } },
            { name: 'trackedLinks', type: 'textarea', label: 'Tracked links (use these in emails you type in Zoho)', admin: { readOnly: true, rows: 8, description: 'Save the row first. Use these instead of plain links so clicks are counted.' } },
            {
              type: 'row',
              fields: [
                { name: 'clickCount', type: 'number', defaultValue: 0, admin: { readOnly: true, width: '33%', components: { Cell: '@/components/payload/OutreachCells#OutreachClicksCell' } } },
                { name: 'firstClickedAt', type: 'date', admin: { readOnly: true, width: '33%', date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'lastClickedAt', type: 'date', admin: { readOnly: true, width: '33%', date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            {
              name: 'clickLog',
              type: 'array',
              label: 'Clicks',
              admin: { readOnly: true },
              fields: [
                { name: 'to', type: 'text' },
                { name: 'at', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
              ],
            },
            {
              // Live from the developer's record, so the log shows whether the email led to a verified company.
              name: 'developerVerified',
              type: 'checkbox',
              label: 'Company verified',
              virtual: true,
              admin: { readOnly: true },
              hooks: {
                afterRead: [
                  async ({ data, req }) => {
                    const devId = data?.developer
                    if (!devId) return false
                    try {
                      const dev = await req.payload.findByID({ collection: 'developers', id: typeof devId === 'object' ? devId.id : devId, depth: 0, select: { domain_verified: true }, req })
                      return Boolean((dev as { domain_verified?: boolean }).domain_verified)
                    } catch {
                      return false
                    }
                  },
                ],
              },
            },
            { name: 'developerName', type: 'text', label: 'Company name', index: true, admin: { readOnly: true, description: 'Filled in from the company you pick.', components: { Cell: '@/components/payload/OutreachCells#OutreachCompanyCell' } } },
            { name: 'sentHtml', type: 'textarea', label: 'Exact email as sent (HTML)', admin: { readOnly: true, rows: 6 } },
            { name: 'notes', type: 'textarea', label: 'Your notes' },
            {
              type: 'row',
              fields: [
                { name: 'code', type: 'text', unique: true, index: true, admin: { readOnly: true, width: '50%', description: 'Identifies this email in the tracked links.' } },
                { name: 'resendId', type: 'text', label: 'Resend ID', admin: { readOnly: true, width: '50%' } },
              ],
            },
          ],
        },
      ],
    },
  ],
}

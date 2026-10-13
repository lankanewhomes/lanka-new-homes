import crypto from 'node:crypto'
import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from './access'
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
    defaultColumns: ['developerName', 'recipient', 'subject', 'sentAt', 'status', 'clickCount', 'developerVerified'],
    hidden: hiddenUnlessAdmin,
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
    { name: 'developer', type: 'relationship', relationTo: 'developers', index: true },
    { name: 'developerName', type: 'text', label: 'Company', index: true, admin: { readOnly: true, description: 'Filled in from the developer you pick.' } },
    { name: 'recipient', type: 'text', label: 'Sent to', admin: { description: 'Name and/or email address, e.g. "Erwan (contact@maisonceylon.com)". Filled in automatically when you send from here.' } },
    // Send from the CMS (owner, 2026-10-12): pick a template, see it, press Send. Save the row first so its tracked links exist.
    { name: 'template', type: 'select', options: OUTREACH_TEMPLATES.map((t) => ({ label: t.label, value: t.id })), admin: { description: 'Pick an email template, then check the preview below.' } },
    { name: 'contactName', type: 'text', label: 'Contact first name', admin: { description: 'Used in "Hi ___,".' } },
    { name: 'toEmail', type: 'email', label: 'Send to (email address)' },
    { name: 'fromAddress', type: 'select', label: 'Send from', defaultValue: 'developers@lankanewhomes.com', options: OUTREACH_SENDERS.map((s) => ({ label: s.label, value: s.value })) },
    { name: 'customNote', type: 'textarea', label: 'Extra note (optional)', admin: { description: 'Added right after the greeting. Leave empty to send the template as is. Do not mention pricing.' } },
    { name: 'sendPanel', type: 'ui', admin: { components: { Field: '@/components/payload/OutreachSendPanel#OutreachSendPanel' } } },
    { name: 'resendId', type: 'text', label: 'Resend ID', admin: { readOnly: true, position: 'sidebar' } },
    { name: 'subject', type: 'text', admin: { description: 'Filled in from the template when you send. Type one yourself for emails you send from Zoho.' } },
    { name: 'sentAt', type: 'date', label: 'Sent on', defaultValue: () => new Date().toISOString(), index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    {
      name: 'channel',
      type: 'select',
      defaultValue: 'zoho',
      options: [
        { label: 'Zoho Mail (typed by hand)', value: 'zoho' },
        { label: 'Resend (sent by the site)', value: 'resend' },
      ],
    },
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
    },
    { name: 'projects', type: 'relationship', relationTo: 'projects', hasMany: true, admin: { description: 'Optional: each project you pick gets its own tracked link below.' } },
    { name: 'code', type: 'text', unique: true, index: true, admin: { readOnly: true, position: 'sidebar', description: 'Identifies this email in the tracked links.' } },
    { name: 'trackedLinks', type: 'textarea', label: 'Tracked links (paste these into the email)', admin: { readOnly: true, rows: 8, description: 'Save the row first. Use these instead of plain links so clicks are counted.' } },
    { name: 'clickCount', type: 'number', defaultValue: 0, admin: { readOnly: true, position: 'sidebar' } },
    { name: 'firstClickedAt', type: 'date', admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'lastClickedAt', type: 'date', admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } } },
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
      label: 'Verified',
      virtual: true,
      admin: { readOnly: true, position: 'sidebar' },
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
    { name: 'notes', type: 'textarea' },
  ],
}

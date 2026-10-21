import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'

// Every email the platform sends to a developer (lead alerts, Verified Developer, invites, digests, password and confirmation emails),
// kept with the developer so their profile shows the full history (owner, 2026-10-15: "keep a track of all the emails in the
// developers profile"). Written automatically by src/lib/email-log.ts from the one place all mail leaves (src/lib/mailer.ts).
// Emails typed in Zoho Mail are not here: they show on the developer's Emails tab from the mail sync. Payload-only, never public.
export const EmailLog: CollectionConfig = {
  slug: 'email-log',
  labels: { singular: 'Sent email', plural: 'Email log' },
  defaultSort: '-sentAt',
  admin: { hidden: true, useAsTitle: 'subject', defaultColumns: ['developerName', 'subject', 'kind', 'toEmail', 'sentAt'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'developer', type: 'relationship', relationTo: 'developers', index: true },
    { name: 'developerName', type: 'text' },
    { name: 'kind', type: 'text', label: 'Type' },
    { name: 'subject', type: 'text', required: true },
    { name: 'toEmail', type: 'text', label: 'To' },
    { name: 'fromEmail', type: 'text', label: 'From' },
    { name: 'bccEmail', type: 'text', label: 'Copied to' },
    { name: 'htmlBody', type: 'textarea' },
    { name: 'textBody', type: 'textarea' },
    { name: 'resendId', type: 'text' },
    { name: 'trackId', type: 'text', index: true, label: 'Tracking id', admin: { readOnly: true } },
    // Filled by the /e/[id] click redirect (src/app/(frontend)/e/[id]/route.ts) with one SQL statement, not by Payload.
    { name: 'clickCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'firstClickedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'clicks', type: 'json', admin: { readOnly: true } },
    // Filled by the /e/[id]/open pixel (src/app/(frontend)/e/[id]/open/route.ts), also with one SQL statement.
    { name: 'openCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
    { name: 'firstOpenedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'sentAt', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

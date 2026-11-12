import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'

// Every WhatsApp message exchanged with developers (and, later, leads) through the WhatsApp Business (Meta Cloud) API.
// Inbound rows are written by the webhook (src/app/(frontend)/api/whatsapp/webhook/route.ts); outbound drafts and sends come next.
// Payload-only (no Supabase mirror): the table is created by Drizzle the next time Payload boots in dev mode. Never public.
export const WhatsAppMessages: CollectionConfig = {
  slug: 'whatsapp-messages',
  labels: { singular: 'WhatsApp message', plural: 'WhatsApp messages' },
  defaultSort: '-sentAt',
  admin: { hidden: true, useAsTitle: 'text', defaultColumns: ['direction', 'phone', 'text', 'status', 'sentAt'] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'direction', type: 'select', required: true, index: true, options: [{ label: 'Inbound (from them)', value: 'inbound' }, { label: 'Outbound (from us)', value: 'outbound' }] },
    // Other party's number, digits only, international format (e.g. 94771234567).
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'text', type: 'textarea' },
    { name: 'messageType', type: 'text', admin: { description: 'text, image, document, template, ...' } },
    { name: 'templateName', type: 'text' },
    // Outbound messages wait here until the owner approves them (owner rule: nothing is sent without approval).
    { name: 'status', type: 'select', required: true, defaultValue: 'received', index: true, options: [
      { label: 'Received', value: 'received' },
      { label: 'Draft (awaiting approval)', value: 'draft' },
      { label: 'Sent', value: 'sent' },
      { label: 'Delivered', value: 'delivered' },
      { label: 'Read', value: 'read' },
      { label: 'Failed', value: 'failed' },
    ] },
    { name: 'error', type: 'text' },
    // Meta's message id (wamid...). Unique, so a webhook retry never stores the same message twice.
    { name: 'waMessageId', type: 'text', unique: true, index: true },
    { name: 'developer', type: 'relationship', relationTo: 'developers', index: true },
    { name: 'lead', type: 'relationship', relationTo: 'leads', index: true },
    { name: 'sentAt', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
  ],
}

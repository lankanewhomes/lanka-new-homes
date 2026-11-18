import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'

// Everyone who sends the /contact form (owner, 2026-11-18: "save all the information to the back end, then I can send them updates and
// newsletters"). One row per email with their details, every message they sent and what they ticked. Status "subscribed" = ticked at least
// one box: that is the list to send newsletters to. Rows are created by the contact route (server side), never by visitors directly.
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Contact', plural: 'Contacts & subscribers' },
  admin: { useAsTitle: 'email', group: 'Business', defaultColumns: ['email', 'name', 'status', 'interests', 'audience', 'createdAt'] },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'name', type: 'text' },
    { name: 'interests', type: 'text', admin: { description: 'What they ticked: newsletter, news, listings, launches.' } },
    { name: 'company', type: 'text' },
    { name: 'phone', type: 'text' },
    { name: 'audience', type: 'text', admin: { description: 'Who they wanted to reach on the form.' } },
    { name: 'message', type: 'textarea', admin: { description: 'Every message they sent, newest first.' } },
    { name: 'source', type: 'text', defaultValue: 'contact-form' },
    { name: 'status', type: 'select', options: ['subscribed', 'contact_only', 'unsubscribed'], defaultValue: 'contact_only', admin: { description: 'subscribed = ticked a box (send them updates). contact_only = just wrote to us. unsubscribed = asked to stop.' } },
  ],
}

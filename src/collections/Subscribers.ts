import type { CollectionConfig } from 'payload'
import { adminOnly } from './access'

// People who ticked "Send me ..." on the /contact form (owner, 2026-11-18). Rows are created by the contact route (server side), never by
// visitors directly, so nothing here is public. Same email twice updates the one row.
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  admin: { useAsTitle: 'email', group: 'Business', defaultColumns: ['email', 'name', 'interests', 'status', 'createdAt'] },
  access: { create: adminOnly, read: adminOnly, update: adminOnly, delete: adminOnly },
  fields: [
    { name: 'email', type: 'email', required: true },
    { name: 'name', type: 'text' },
    { name: 'interests', type: 'text', admin: { description: 'What they ticked: newsletter, news, listings, launches.' } },
    { name: 'source', type: 'text', defaultValue: 'contact-form' },
    { name: 'status', type: 'select', options: ['subscribed', 'unsubscribed'], defaultValue: 'subscribed' },
  ],
}

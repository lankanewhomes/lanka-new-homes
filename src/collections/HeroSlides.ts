import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, isAdmin, ownDeveloperAccess, publicRead } from './access'

// "Only admins can create/edit; developers can request a slot but admin
// approves/activates it" — a developer CAN create (tied to their own
// company via `advertiser`), but every non-admin create is forced to
// status: 'pending', and only admins can update (approve/activate/reject)
// afterward.
export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'page_target',
    defaultColumns: ['page_target', 'display_order', 'status', 'is_paid_placement'],
  },
  access: {
    read: publicRead,
    create: ownDeveloperAccess('advertiser'),
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && !isAdmin(req)) {
          return { ...data, status: 'pending' }
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'image', type: 'text', required: true, admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    { name: 'link', type: 'text' },
    { name: 'page_target', type: 'text', label: 'Page Target', admin: { description: 'e.g. homepage, colombo, luxury' } },
    { name: 'display_order', type: 'number', label: 'Display Order', defaultValue: 0 },
    { name: 'advertiser', type: 'relationship', relationTo: 'developers' },
    { name: 'start_date', type: 'date', label: 'Start Date' },
    { name: 'end_date', type: 'date', label: 'End Date' },
    { name: 'is_paid_placement', type: 'checkbox', label: 'Is Paid Placement', defaultValue: false },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'active', 'rejected'],
      access: { update: adminOnlyField },
    },
  ],
}

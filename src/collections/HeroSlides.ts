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
    { name: 'image', type: 'text', admin: { description: 'Legacy external image URL. Use Hero Image for new paid placements.' } },
    { name: 'hero_image', type: 'relationship', relationTo: 'media', label: 'Hero Image', admin: { description: 'Choose the banner image uploaded through Media.' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: 'Featured Project', required: true, admin: { description: 'The project opened when a visitor clicks this paid hero placement.' } },
    { name: 'link', type: 'text' },
    { name: 'page_target', type: 'text', label: 'Page Target', admin: { description: 'e.g. homepage, colombo, luxury' } },
    { name: 'display_order', type: 'number', label: 'Display Order', defaultValue: 0 },
    { name: 'advertiser', type: 'relationship', relationTo: 'developers' },
    { name: 'start_date', type: 'date', label: 'Start Date' },
    { name: 'end_date', type: 'date', label: 'End Date' },
    { name: 'is_paid_placement', type: 'checkbox', label: 'Is Paid Placement', defaultValue: true, admin: { readOnly: true, description: 'Homepage hero placements are paid inventory.' } },
    { name: 'payment', type: 'relationship', relationTo: 'payments', label: 'Payment Record', admin: { description: 'Attach the completed Hero Slide or Hero Image payment before activating this placement.' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'active', 'rejected'],
      access: { update: adminOnlyField },
    },
  ],
}

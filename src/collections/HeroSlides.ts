import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, isAdmin, ownDeveloperAccess, publicRead } from './access'
import { syncHeroSlideDeleteToSupabase, syncHeroSlideToSupabase } from './hooks/sync-to-supabase'

// "Only admins can create/edit; developers can request a slot but admin
// approves/activates it" — a developer CAN create (tied to their own
// company via `advertiser`), but every non-admin create is forced to
// status: 'pending', and only admins can update (approve/activate/reject)
// afterward.
export const HeroSlides: CollectionConfig = {
  slug: 'hero-slides',
  admin: {
    useAsTitle: 'page_target',
    group: 'Content',
    defaultColumns: ['page_target', 'display_order', 'status', 'is_paid_placement', 'auto_generated'],
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
    afterChange: [syncHeroSlideToSupabase],
    afterDelete: [syncHeroSlideDeleteToSupabase],
  },
  fields: [
    { name: 'headline', type: 'text', required: true, admin: { description: 'Shown over the banner image, e.g. "Now Selling: Colombo Heights".' } },
    { name: 'image', type: 'text', required: true, admin: { description: 'Wide banner image URL (at least 2000px). Upload one in Media and paste its URL here, same as any other image field.' } },
    { name: 'project', type: 'relationship', relationTo: 'projects', label: 'Featured Project', required: true, admin: { description: 'The project opened when a visitor clicks this paid hero placement.' } },
    { name: 'link', type: 'text' },
    { name: 'page_target', type: 'text', label: 'Page Target', admin: { description: 'e.g. homepage, colombo, luxury' } },
    { name: 'display_order', type: 'number', label: 'Display Order', defaultValue: 0 },
    { name: 'advertiser', type: 'relationship', relationTo: 'developers' },
    { name: 'start_date', type: 'date', label: 'Start Date' },
    { name: 'end_date', type: 'date', label: 'End Date' },
    { name: 'is_paid_placement', type: 'checkbox', label: 'Is Paid Placement', defaultValue: true, admin: { readOnly: true, description: 'Homepage hero placements are paid inventory.' } },
    {
      name: 'auto_generated',
      type: 'checkbox',
      label: 'Auto Generated',
      defaultValue: false,
      admin: {
        readOnly: true,
        description:
          "Was auto-created/archived by a Developer Pro/Campaign subscription (the old hooks/sync-subscription-package.ts). Billing moved to per-developer 2026-09-24 (see hooks/sync-developer-plan.ts) and this auto-creation was intentionally NOT carried over — which of a developer's several featured projects should represent them in one hero slide isn't decided yet (see the placement-inventory notes), so this flag is currently unused; every slide is created by hand today.",
      },
    },
    { name: 'payment', type: 'relationship', relationTo: 'payments', label: 'Payment Record', admin: { description: 'Attach the completed Hero Slide or Hero Image payment before activating this placement — set automatically once that payment is confirmed.' } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      options: ['pending', 'active', 'rejected', 'archived'],
      access: { update: adminOnlyField },
    },
    {
      name: 'review_note',
      type: 'text',
      label: 'Review Note',
      access: { update: adminOnlyField },
      admin: { description: 'Shown to the developer, e.g. the reason a request was rejected.' },
    },
  ],
}

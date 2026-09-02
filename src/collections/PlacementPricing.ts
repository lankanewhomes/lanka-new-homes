import type { CollectionConfig } from 'payload'
import { adminOnly, publicRead } from './access'
import { FEATURED_PAGE_OPTIONS } from './shared-fields'
import { PAYMENT_TYPE_OPTIONS } from './Payments'

// Rate card for every paid placement/product a developer or builder can pay
// for (see Payments.ts's payment_type). Public read so a future developer
// portal can show "how much does this cost" before someone submits a
// payment request; admin-only to edit. Seeded with made-up placeholder
// prices (scripts/seed-placement-pricing.ts) — adjust freely, nothing else
// depends on the exact numbers.
export const PlacementPricing: CollectionConfig = {
  slug: 'placement-pricing',
  admin: {
    useAsTitle: 'tier_name',
    defaultColumns: ['payment_type', 'tier_name', 'featured_page', 'price', 'currency', 'duration_days'],
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'payment_type', type: 'select', label: 'Payment Type', required: true, options: PAYMENT_TYPE_OPTIONS },
    {
      name: 'featured_page',
      type: 'select',
      label: 'Page',
      options: FEATURED_PAGE_OPTIONS,
      admin: { description: 'For featured_listing/featured_search: which page this price applies to. Leave blank for a page-independent price.' },
    },
    {
      name: 'tier_name',
      type: 'text',
      label: 'Tier Name',
      admin: { description: 'e.g. "Professional", "50 Leads" — lets subscription/lead_package have multiple price points.' },
    },
    { name: 'price', type: 'number', required: true },
    { name: 'currency', type: 'select', required: true, defaultValue: 'LKR', options: ['LKR', 'USD'] },
    {
      name: 'duration_days',
      type: 'number',
      label: 'Duration (Days)',
      admin: { description: 'How many days this price covers, e.g. 30 for a monthly placement window.' },
    },
    { name: 'description', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true },
  ],
}

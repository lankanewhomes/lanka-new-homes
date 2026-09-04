import type { CollectionConfig } from 'payload'
import { adminOnly, isAdmin, ownPayerAccess } from './access'
import { FEATURED_PAGE_OPTIONS } from './shared-fields'
import { activatePlacementOnPayment } from './hooks/activate-placement'

// Placement/monetization products a developer or builder can pay for.
// featured_listing/featured_search both drive Projects.placements once
// confirmed (see hooks/activate-placement.ts); the rest are logged here as
// a payment record only — no automatic activation elsewhere yet.
export const PAYMENT_TYPE_OPTIONS = [
  { label: 'Featured Listing', value: 'featured_listing' },
  { label: 'Featured in Search Results', value: 'featured_search' },
  { label: 'Hero Slide (homepage carousel)', value: 'hero_slide' },
  { label: 'Hero Image', value: 'hero_image' },
  { label: 'Banner Ad', value: 'banner_ad' },
  { label: 'Top of Category', value: 'top_of_category' },
  { label: 'Subscription', value: 'subscription' },
  { label: 'Lead Package', value: 'lead_package' },
]

// Schema + admin-visible payment log — no live payment provider integration
// (Stripe etc.) yet. `provider_reference` is a placeholder for whatever id
// a future integration would store (e.g. a Stripe payment intent/session
// id).
//
// A developer or construction_company (builder) can submit their own
// payment request (self-service create, forced to status: 'pending' —
// see the hook below), but only an admin can confirm it. Confirming a
// featured_listing payment (status -> completed) auto-activates the
// linked project's placement (see hooks/activate-placement.ts) — no
// separate manual "mark as featured" step.
export const Payments: CollectionConfig = {
  slug: 'payments',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['payer', 'payment_type', 'amount', 'currency', 'status', 'payment_date'],
  },
  access: {
    read: ownPayerAccess('payer'),
    create: ownPayerAccess('payer'),
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
    afterChange: [activatePlacementOnPayment],
  },
  fields: [
    {
      name: 'payer',
      type: 'relationship',
      relationTo: ['developers', 'construction-companies'],
      required: true,
      index: true,
      admin: { description: 'The developer or construction company (builder) this payment is for.' },
    },
    { name: 'amount', type: 'number', required: true },
    { name: 'currency', type: 'select', required: true, defaultValue: 'LKR', options: ['LKR', 'USD'] },
    {
      name: 'payment_type',
      type: 'select',
      label: 'Payment Type',
      required: true,
      options: PAYMENT_TYPE_OPTIONS,
    },
    { name: 'related_project', type: 'relationship', relationTo: 'projects', label: 'Related Project' },
    {
      name: 'related_hero_slide',
      type: 'relationship',
      relationTo: 'hero-slides',
      label: 'Related Hero Slide',
      admin: {
        description: 'For a hero_slide (or hero_image) payment: which hero slide request this pays for. Confirming this payment activates that slide automatically.',
        condition: (data) => data?.payment_type === 'hero_slide' || data?.payment_type === 'hero_image',
      },
    },
    {
      name: 'featured_page',
      type: 'select',
      label: 'Featured Page',
      options: FEATURED_PAGE_OPTIONS,
      admin: {
        description: 'For a featured_listing (or featured_search) payment: which page to feature the project on once confirmed.',
        condition: (data) => data?.payment_type === 'featured_listing' || data?.payment_type === 'featured_search',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'completed', 'failed', 'refunded'],
    },
    { name: 'payment_date', type: 'date', label: 'Payment Date' },
    { name: 'expiry_date', type: 'date', label: 'Expiry Date', admin: { description: 'For time-limited placements, e.g. a featured-listing or hero-slide window.' } },
    { name: 'provider_reference', type: 'text', label: 'Provider Reference', admin: { description: 'Placeholder for a future payment provider (e.g. Stripe) reference id.' } },
  ],
}

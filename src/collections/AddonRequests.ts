import type { CollectionConfig, Where } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, isAdmin, ownDeveloperAccess } from './access'
import { ADDON_PRICES } from '@/lib/packages'

// À la carte newsletter/social promotion requests for ONE project — the
// "Add-on" cells on the public pricing table (Free/Featured/Featured Plus
// don't get these included; Developer Pro gets one per quarter; Campaign
// has it bundled). Owner, 2026-09-24: "can we built this. No à la carte
// purchase flow exists yet." Same shape as every other not-yet-gatewayed
// purchase on this site — a request an admin fulfills by hand (no
// newsletter system or automated social-publishing pipeline exists yet
// either, so "fulfilled" here means the team did the work manually, not
// that a system sent anything automatically).
export const ADDON_TYPE_OPTIONS = ['newsletter', 'social'] as const
export const ADDON_STATUS_OPTIONS = ['requested', 'confirmed', 'fulfilled', 'canceled'] as const

export const AddonRequests: CollectionConfig = {
  slug: 'addon-requests',
  admin: {
    useAsTitle: 'id',
    group: 'Business',
    defaultColumns: ['developer', 'project', 'addon_type', 'price', 'status', 'createdAt'],
  },
  access: {
    read: ownDeveloperAccess('developer'),
    create: ownDeveloperAccess('developer'),
    update: ownDeveloperAccess('developer'),
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation !== 'create') return data
        // Price is never trusted from the client — same "server looks it
        // up" rule as every other pricing decision on this site.
        const addonType = data.addon_type as keyof typeof ADDON_PRICES
        return { ...data, status: 'requested', price: ADDON_PRICES[addonType] ?? 0, currency: 'LKR' }
      },
    ],
  },
  fields: [
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'developers',
      required: true,
      index: true,
      access: { update: adminOnlyField },
      filterOptions: async ({ req }) => {
        if (isAdmin(req)) return true
        const ownedIds = await getOwnedDeveloperIds(req)
        return { id: { in: ownedIds.length ? ownedIds : [-1] } }
      },
    },
    {
      name: 'project',
      type: 'relationship',
      relationTo: 'projects',
      required: true,
      index: true,
      admin: { description: 'Which project this newsletter feature/social push is for.' },
      filterOptions: async ({ req }) => {
        if (isAdmin(req)) return true
        const ownedDeveloperIds = await getOwnedDeveloperIds(req)
        return { developer: { in: ownedDeveloperIds.length ? ownedDeveloperIds : [-1] } } as Where
      },
    },
    { name: 'addon_type', type: 'select', label: 'Add-on', options: [...ADDON_TYPE_OPTIONS], required: true, access: { update: adminOnlyField } },
    { name: 'price', type: 'number', access: { update: adminOnlyField }, admin: { readOnly: true, description: 'Snapshot of the add-on price at request time, from src/lib/packages.ts.' } },
    { name: 'currency', type: 'select', options: ['LKR'], defaultValue: 'LKR', access: { update: adminOnlyField } },
    {
      name: 'status',
      type: 'select',
      options: [...ADDON_STATUS_OPTIONS],
      defaultValue: 'requested',
      required: true,
      access: { update: adminOnlyField },
      admin: { description: 'Set by an admin as the request is worked — "confirmed" (payment/scope agreed) then "fulfilled" once the newsletter feature or social post actually goes out.' },
    },
    { name: 'notes', type: 'textarea', admin: { description: 'Optional — anything specific to ask for (e.g. a particular angle for the feature, preferred timing).' } },
  ],
}

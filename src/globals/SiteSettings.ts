import type { GlobalConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from '../collections/access'
import { socialLinksField } from '../collections/shared-fields'

// Site-wide settings the frontend can read publicly (contact info, SEO
// defaults, social links) — a singleton, not a collection, since there's
// only ever one of these.
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { hidden: hiddenUnlessAdmin },
  access: {
    read: publicRead,
    update: adminOnly,
  },
  fields: [
    { name: 'siteName', type: 'text', label: 'Site Name', defaultValue: 'LankaNewHomes' },
    { name: 'contactEmail', type: 'email', label: 'Contact Email' },
    { name: 'contactPhone', type: 'text', label: 'Contact Phone' },
    socialLinksField,
    {
      name: 'seoDefaults',
      type: 'group',
      label: 'SEO Defaults',
      fields: [
        { name: 'defaultTitle', type: 'text', label: 'Default Title' },
        { name: 'defaultDescription', type: 'textarea', label: 'Default Description' },
        { name: 'defaultOgImage', type: 'text', label: 'Default OG Image', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
      ],
    },
  ],
}

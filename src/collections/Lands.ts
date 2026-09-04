import type { CollectionConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from './access'
import { syncLandToSupabase } from './hooks/sync-to-supabase'
import {
  amenitiesField,
  CITY_OPTIONS,
  contactField,
  coordinatesField,
  DISTRICT_OPTIONS,
  ELECTRICITY_OPTIONS,
  galleryLikeField,
  nearbyField,
  PROVINCE_OPTIONS,
  seoFields,
  selectWithOther,
  unitFeaturesField,
} from './shared-fields'

// Raw land parcels for sale — a separate inventory type from Projects, sold
// by developers, construction companies, or independent builders (see
// docs/roadmap.md "Lands for sale"). `seller` is polymorphic (points at
// either a Developer or a Construction Company) for sellers who have a
// profile in the system; `sellerName` (always required) covers the rest.
//
// Access stays admin-only for create/update/delete for now — Projects'
// per-owner edit access relies on a single relationTo (`developers`), and
// generalizing that to Land's polymorphic seller wasn't part of this pass.
export const Lands: CollectionConfig = {
  slug: 'lands',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'sellerName', 'status', 'priceLkr', 'district'],
    hidden: hiddenUnlessAdmin,
  },
  access: {
    read: publicRead,
    create: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  hooks: {
    afterChange: [syncLandToSupabase],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'slug', type: 'text', required: true, unique: true, index: true },
            { name: 'title', type: 'text', required: true },
            {
              name: 'sellerType',
              type: 'select',
              required: true,
              options: ['developer', 'construction_company', 'builder'],
            },
            {
              name: 'seller',
              type: 'relationship',
              relationTo: ['developers', 'construction-companies'],
              admin: { description: 'Used when sellerType is developer or construction_company.' },
            },
            { name: 'sellerName', type: 'text', required: true, admin: { description: 'Always shown; the only identifier when sellerType is "builder".' } },
            { name: 'location', type: 'text' },
            ...selectWithOther('district', 'District', DISTRICT_OPTIONS),
            ...selectWithOther('city', 'City', CITY_OPTIONS),
            ...selectWithOther('province', 'Province', PROVINCE_OPTIONS),
            { name: 'status', type: 'select', required: true, defaultValue: 'Available', options: ['Available', 'Reserved', 'Sold'], index: true },
            { name: 'isFeatured', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          label: 'Size & Pricing',
          fields: [
            { name: 'landSizePerches', type: 'number', required: true },
            { name: 'landSizeAcres', type: 'number' },
            { name: 'priceLkr', type: 'number', required: true },
            { name: 'pricePerPerchLkrMin', type: 'number' },
            { name: 'pricePerPerchLkrMax', type: 'number' },
            { name: 'landUse', type: 'text', required: true, admin: { description: 'e.g. Residential, Commercial, Agricultural, Mixed' } },
            { name: 'landType', type: 'text', admin: { description: 'e.g. Bare Land, Land with House, Paddy Land, Coconut Land' } },
            { name: 'landShape', type: 'text', admin: { description: 'e.g. Rectangular, Square, Irregular, L-Shaped' } },
            { name: 'roadAccess', type: 'text' },
            { name: 'roadWidthFt', type: 'number' },
            ...selectWithOther('electricity', 'Electricity', ELECTRICITY_OPTIONS),
            { name: 'water', type: 'text' },
            { name: 'titleType', type: 'text', admin: { description: 'e.g. Freehold - Sinhala Deed, Freehold - Swarnabhoomi, Torrens Title' } },
            { name: 'surveyPlanStatus', type: 'text' },
            { name: 'paymentPlanItems', type: 'text', hasMany: true },
          ],
        },
        {
          label: 'Content & Media',
          fields: [
            { name: 'summary', type: 'textarea' },
            { name: 'description', type: 'textarea' },
            { name: 'heroImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
            galleryLikeField('gallery'),
            galleryLikeField('blockPlanImages', 'Block Plan Images'),
            galleryLikeField('roadMapImages', 'Road Map Images'),
            {
              name: 'videos',
              type: 'array',
              fields: [
                { name: 'label', type: 'text' },
                { name: 'url', type: 'text', required: true, admin: { description: 'YouTube/Vimeo link — or upload a video file in Media and paste its URL here.' } },
              ],
            },
            { name: 'badges', type: 'text', hasMany: true, admin: { description: 'Marketing trust badges, e.g. "Easy Payment Plan"' } },
          ],
        },
        {
          label: 'Amenities & Features',
          fields: [
            { name: 'facilities', type: 'text', hasMany: true, admin: { description: 'General parcel characteristics, e.g. "Wide Road", "Corner Plot"' } },
            amenitiesField,
            unitFeaturesField,
          ],
        },
        {
          label: 'Plots & Nearby',
          fields: [
            {
              name: 'plots',
              type: 'array',
              admin: { description: 'Individual plots/lots within this land development — omit for a single unsubdivided parcel.' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'sizePerches', type: 'number', required: true },
                { name: 'priceLkr', type: 'number', required: true },
                { name: 'status', type: 'select', required: true, defaultValue: 'Available', options: ['Available', 'Reserved', 'Sold'] },
                { name: 'image', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
              ],
            },
            nearbyField,
          ],
        },
        {
          label: 'Location & Contact',
          fields: [coordinatesField, contactField],
        },
        {
          label: 'SEO',
          fields: [seoFields],
        },
      ],
    },
  ],
}

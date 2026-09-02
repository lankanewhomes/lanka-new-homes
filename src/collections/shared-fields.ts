import type { CollectionAfterChangeHook, CollectionConfig, Field } from 'payload'
import { adminOnly, publicRead } from './access'

// A closed dropdown plus a separate "(Other)" text field for anything not
// in the preset list — same escape-hatch idea as coDevelopers next to
// Additional Developers, just for plain-value fields instead of
// relationships. Returns [select, otherText] to spread into a fields array.
export function selectWithOther(name: string, label: string, options: string[], description?: string): Field[] {
  return [
    {
      name,
      type: 'select',
      label,
      options,
      admin: description ? { description } : undefined,
    },
    {
      name: `${name}_other`,
      type: 'text',
      label: `${label} (Other)`,
      admin: { description: `Custom value, used when ${label} above doesn't have the right option.` },
    },
  ]
}

// Sri Lanka's 9 provinces.
export const PROVINCE_OPTIONS = [
  'Western',
  'Central',
  'Southern',
  'Northern',
  'Eastern',
  'North Western',
  'North Central',
  'Uva',
  'Sabaragamuwa',
]

// Sri Lanka's 25 districts.
export const DISTRICT_OPTIONS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Monaragala', 'Ratnapura', 'Kegalle',
]

export const OWNERSHIP_OPTIONS = ['Freehold', 'Leasehold', 'Condominium']

export const CONSTRUCTION_STATUS_OPTIONS = [
  'Not Started', 'Foundation', 'Under Construction', 'Structure Complete', 'Finishing', 'Completed', 'Ready to Move In',
]

export const TAP_WATER_OPTIONS = ['Available', 'Metered', 'Not Available', 'Well Water']

export const ELECTRICITY_OPTIONS = ['Available', '3-Phase Available', 'Metered', 'Not Available', 'Solar']

// Matches the plural forms already used by src/lib/listing-categories.ts's
// filter logic (project.type === "Apartments" / "Villas").
export const PROJECT_TYPE_OPTIONS = [
  'Apartments', 'Condominium', 'Villas', 'House', 'Townhouse', 'Serviced Apartment', 'Mixed-Use',
]

// The site's keyword-targeted pages a project can be paid-featured on (see
// src/lib/listing-categories.ts) — shared by Projects.placements and
// Payments.featured_page.
export const FEATURED_PAGE_OPTIONS = [
  { label: 'Sitewide (homepage)', value: 'sitewide' },
  { label: 'Colombo', value: 'colombo' },
  { label: 'Colombo — Luxury', value: 'colombo-luxury' },
  { label: 'Pre-Construction', value: 'pre-construction' },
  { label: 'Branded Residences', value: 'branded-residences' },
  { label: 'Villas', value: 'villas' },
  { label: 'Beachfront', value: 'beachfront' },
  { label: 'Serviced Apartments', value: 'serviced-apartments' },
  { label: 'Port City Colombo', value: 'port-city-colombo' },
  { label: 'Search Results', value: 'search' },
  { label: 'Land Listings', value: 'land' },
]

// Matches the `SocialLinks` type in src/types/index.ts.
export const socialLinksField: Field = {
  name: 'socialLinks',
  type: 'group',
  label: 'Social Links',
  fields: [
    { name: 'facebook', type: 'text' },
    { name: 'instagram', type: 'text' },
    { name: 'linkedin', type: 'text' },
    { name: 'twitter', type: 'text' },
    { name: 'whatsapp', type: 'text' },
    { name: 'youtube', type: 'text' },
    { name: 'tiktok', type: 'text' },
  ],
}

// Shared with Projects and Lands — matches the `Amenity` name union in
// src/types/index.ts.
export const AMENITY_NAME_OPTIONS = [
  'Pool',
  'Gym',
  'Rooftop',
  'Parking',
  'Security',
  'CCTV',
  'Garden',
  "Children's Area",
  'Clubhouse',
  'EV Charging',
  'Concierge',
  'Padel Court',
  'Resident Lounge',
  'Private Elevator',
  'Utility Area',
  'Outdoor Kitchen',
  'Infinity Pool',
  'Games Room',
  'Sky Lounge',
  'Retail Mall',
  'Hotel',
  'Gated Community',
  'Beachfront',
  'Sea View',
]

export const amenitiesField: Field = {
  name: 'amenities',
  type: 'array',
  fields: [
    { name: 'name', type: 'select', options: AMENITY_NAME_OPTIONS, required: true },
    { name: 'icon', type: 'text' },
  ],
}

// Common feature names for Key Feature items (Kitchen -> "Pantry cabinets",
// etc.) — a starting list, extendable via the (Other) fallback. First row is
// indoor-leaning, second row outdoor-leaning, but either can be used under
// either category.
export const KEY_FEATURE_FIELD_OPTIONS = [
  'Kitchen', 'Bathroom', 'Windows', 'Climate', 'Lighting', 'Security',
  'Connectivity', 'Laundry', 'Storage', 'Appliances', 'Flooring',
  'Balcony', 'Garden', 'Pool', 'Parking', 'Outdoor Kitchen', 'View', 'Landscaping',
]

// Same KeyFeatureCategory shape used by Project.unitFeatures and
// Land.unitFeatures. `key` drives the section icon ("indoor"/"outdoor" get
// a matching icon on the frontend; anything else falls back to a generic
// one) — `label` is the separate, freely-editable category name shown to
// visitors, so a custom category can still be named clearly.
export const unitFeaturesField: Field = {
  name: 'unitFeatures',
  type: 'array',
  label: 'Key Features',
  fields: [
    ...selectWithOther('key', 'Category', ['indoor', 'outdoor']),
    { name: 'label', type: 'text', required: true, label: 'Category Name' },
    {
      name: 'items',
      type: 'array',
      fields: [
        ...selectWithOther('field', 'Feature', KEY_FEATURE_FIELD_OPTIONS),
        { name: 'value', type: 'text', required: true },
      ],
    },
  ],
}

export const nearbyField: Field = {
  name: 'nearby',
  type: 'array',
  fields: [
    {
      name: 'category',
      type: 'select',
      required: true,
      options: ['School', 'Hospital', 'Shopping', 'Restaurant', 'Transport', 'Landmark'],
    },
    { name: 'name', type: 'text', required: true },
    { name: 'distanceKm', type: 'number' },
  ],
}

export const coordinatesField: Field = {
  name: 'coordinates',
  type: 'group',
  fields: [
    { name: 'lat', type: 'number' },
    { name: 'lng', type: 'number' },
  ],
}

export const contactField: Field = {
  name: 'contact',
  type: 'group',
  fields: [
    { name: 'name', type: 'text' },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
  ],
}

export function galleryLikeField(name: string, label?: string): Field {
  return {
    name,
    type: 'array',
    label,
    fields: [
      { name: 'label', type: 'text' },
      { name: 'image', type: 'text', required: true, admin: { description: 'Image URL' } },
    ],
  }
}

// Mirrors the `SeoFields` type shared by Project/Developer/Neighborhood in
// src/types/index.ts.
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'SEO',
  fields: [
    { name: 'seoTitle', type: 'text' },
    { name: 'seoDescription', type: 'textarea' },
    { name: 'ogImage', type: 'text', admin: { description: 'Image URL' } },
    { name: 'canonicalUrl', type: 'text' },
    { name: 'noIndex', type: 'checkbox', defaultValue: false },
  ],
}

// The repeated slug/name/logo/description/contact_email/contact_phone shape
// used by Developers, Construction/Marketing/Sales Companies, and
// Architects. `extra` appends the one or two fields each of those adds on
// top (e.g. `website`, `services`, `portfolio_link`).
export function companyProfileFields(extra: Field[] = []): Field[] {
  return [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'text', admin: { description: 'Logo image URL' } },
    { name: 'description', type: 'textarea' },
    { name: 'contact_email', type: 'email', label: 'Contact Email' },
    { name: 'contact_phone', type: 'text', label: 'Contact Phone' },
    ...extra,
  ]
}

// Same {date, note} shape reused for Project's pricing/availability/status/
// completion-date history logs.
export function historyLogField(name: string, label: string): Field {
  return {
    name,
    type: 'array',
    label,
    fields: [
      { name: 'date', type: 'date' },
      { name: 'note', type: 'text' },
    ],
  }
}

// Construction/Marketing/Sales Companies and Architects are all "admin-
// entered only" directories sharing the CompanyProfile shape, differing
// only in slug and one trailing field (services vs. portfolio_link).
export function directoryCollection(slug: string, extraFields: Field[], afterChangeHooks: CollectionAfterChangeHook[] = []): CollectionConfig {
  return {
    slug,
    admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'contact_email'] },
    access: {
      read: publicRead,
      create: adminOnly,
      update: adminOnly,
      delete: adminOnly,
    },
    hooks: { afterChange: afterChangeHooks },
    fields: companyProfileFields(extraFields),
  }
}

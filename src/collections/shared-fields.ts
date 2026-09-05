import type { CollectionAfterChangeHook, CollectionConfig, Field } from 'payload'
import { adminOnly, hiddenUnlessAdmin, publicRead } from './access'
import cities from '../data/cities.json'

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

// Every Sri Lankan city/town, from the same src/data/cities.json the
// frontend's district->city picker already uses — plus the district names
// themselves (cities.json is ward/neighborhood-granular, e.g. "Colombo 1"
// through "Colombo 15", and doesn't separately list the plain district
// capital name most listings actually use) — sorted, deduplicated.
export const CITY_OPTIONS: string[] = Array.from(
  new Set([...DISTRICT_OPTIONS, ...(cities as { name_en: string }[]).map((c) => c.name_en)]),
).sort()

export const OWNERSHIP_OPTIONS = ['Freehold', 'Leasehold', 'Condominium']

export const CONSTRUCTION_STATUS_OPTIONS = [
  'Not Started', 'Foundation', 'Under Construction', 'Structure Complete', 'Finishing', 'Completed', 'Ready to Move In',
]

export const TAP_WATER_OPTIONS = ['Available', 'Metered', 'Not Available', 'Well Water']

export const ELECTRICITY_OPTIONS = ['Available', '3-Phase Available', 'Metered', 'Not Available', 'Solar']

export const PLAN_TYPE_OPTIONS = [
  'Open Floor Plan', 'Closed Floor Plan', 'Studio Floor Plan', 'Multi-Story Floor Plan',
  'Split-Level Floor Plan', 'Loft', 'Duplex', 'Penthouse',
]

export const BASEMENT_OPTIONS = ['None', 'Unfinished', 'Finished', 'Walkout', 'Partial']

export const GARAGE_OPTIONS = ['None', 'Attached', 'Detached', 'Carport', 'Underground']

export const PARKING_TYPE_OPTIONS = [
  'Indoor', 'Outdoor', 'Covered', 'Underground', 'Garage', 'Driveway', 'Street', 'Assigned', 'Visitor', 'Private (Dedicated)',
]

export const SECURITY_OPTIONS = [
  '24/7 Security Guard', 'CCTV Surveillance', 'Gated Entry', 'Access Control System',
  'Intercom / Video Phone', 'Alarm System', 'Perimeter Fencing', 'Security Patrol',
  'Biometric Access', 'Visitor Management System',
]

// Matches the plural forms already used by src/lib/listing-categories.ts's
// filter logic (project.type === "Apartments" / "Villas").
export const PROJECT_TYPE_OPTIONS = [
  'Apartments', 'Condominium', 'Villas', 'House', 'Townhouse', 'Serviced Apartment', 'Mixed-Use', 'Luxury Beach Villas', 'Luxury Retirement Cottages',
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
  fields: [{ name: 'name', type: 'select', options: AMENITY_NAME_OPTIONS, required: true }],
}

// Common feature names for Key Feature items (Kitchen -> "Pantry cabinets",
// etc.) — a starting list, extendable via the (Other) fallback. First row is
// indoor-leaning, second row outdoor-leaning, but either can be used under
// either category.
export const KEY_FEATURE_FIELD_OPTIONS = [
  'Bathroom', 'Kitchen', 'Living Areas', 'Bedrooms & Closets',
  'Flooring & Finishes', 'Heating, Cooling & Systems', 'Smart Home & Security',
  'Storage & Utility', 'Additional Spaces',
  'Balcony', 'Garden', 'Pool', 'Parking', 'Outdoor Kitchen', 'View', 'Landscaping',
]

// Common answers for each Key Feature field above — one shared flat list
// rather than a value list scoped per field, same escape-hatch pattern as
// everything else here via selectWithOther's "(Other)" fallback.
export const KEY_FEATURE_VALUE_OPTIONS = [
  // Bathroom
  'Walk-in shower with glass enclosure', 'Soaking tub / freestanding bathtub',
  'Double vanity with quartz/granite countertop', 'Heated flooring', 'Rainfall showerhead',
  'Built-in medicine cabinet with mirror', 'Recessed/LED lighting', 'Exhaust fan with humidity sensor',
  'Bidet or bidet attachment', 'Towel warmer', 'Linen closet / built-in storage',
  'Non-slip tile flooring', 'Water-efficient toilet (dual-flush)', 'Frameless glass shower doors',
  'Ensuite access from primary bedroom',
  // Kitchen
  'Gourmet kitchen with island', 'Stainless steel appliances', 'Granite/quartz countertops',
  'Walk-in pantry', 'Custom cabinetry', 'Wine cellar / wet bar',
  // Living Areas
  'Open-concept living/dining/kitchen layout', 'Gas fireplace', 'Crown moulding / trim work',
  '9-10 ft ceilings', 'Large windows / natural light', 'Skylights',
  // Bedrooms & Closets
  'Walk-in closets',
  // Flooring & Finishes
  'Hardwood/laminate/vinyl plank flooring', 'Pot lights / recessed lighting',
  // Heating, Cooling & Systems
  'Central air conditioning', 'Forced-air heating', 'Central vacuum system',
  // Smart Home & Security
  'Smart home features (thermostat, lighting, locks)', 'Built-in speakers / wired for sound',
  'Security system / cameras', 'Video phone', 'CCTV', '24-hour security guard', 'Gated entry', 'Alarm system',
  // Storage & Utility
  'Laundry room (main/upper floor)',
  // Additional Spaces
  'Finished basement', 'Home office / den', 'Elevator (multi-storey)',
  // Balcony
  'Terrace included', 'Private balcony', 'Wraparound balcony',
  // Garden
  'Private garden', 'Landscaped garden', 'Rooftop garden',
  // Pool
  'Private pool', 'Shared pool access', 'Plunge pool',
  // Parking
  'Covered parking', 'Private garage', 'Visitor parking',
  // Outdoor Kitchen
  'Built-in BBQ', 'Outdoor dining area', 'Covered patio kitchen',
  // View
  'Sea view', 'City view', 'Garden view', 'Mountain view',
  // Landscaping
  'Professionally landscaped', 'Native plants', 'Irrigation system',
]

const KEY_FEATURE_CATEGORY_LABELS: Record<string, string> = {
  indoor: 'Indoor Features',
  outdoor: 'Outdoor Features',
}

// Same KeyFeatureCategory shape used by Project.unitFeatures and
// Land.unitFeatures. `key` drives both the section icon ("indoor"/"outdoor"
// get a matching icon on the frontend; anything else falls back to a
// generic one) and the visitor-facing label, auto-derived below so there's
// nothing to re-type — pick indoor/outdoor (or type a custom category in
// the "(Other)" field) and the label follows automatically.
export const unitFeaturesField: Field = {
  name: 'unitFeatures',
  type: 'array',
  label: 'Key Features',
  fields: [
    ...selectWithOther('key', 'Category', ['indoor', 'outdoor']),
    {
      name: 'label',
      type: 'text',
      label: 'Category Name',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ siblingData }) => {
            const other = typeof siblingData.key_other === 'string' ? siblingData.key_other.trim() : ''
            if (other) return other
            return KEY_FEATURE_CATEGORY_LABELS[siblingData.key as string] ?? siblingData.key ?? ''
          },
        ],
      },
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        ...selectWithOther('field', 'Feature', KEY_FEATURE_FIELD_OPTIONS),
        ...selectWithOther('value', 'Value', KEY_FEATURE_VALUE_OPTIONS),
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
      { name: 'image', type: 'text', required: true, admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
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
    { name: 'ogImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
    { name: 'canonicalUrl', type: 'text' },
    { name: 'noIndex', type: 'checkbox', defaultValue: false },
  ],
}

// The repeated slug/name/logo/description/contact_email/contact_phone shape
// used by Developers, Construction/Marketing/Sales Companies, and
// Architects. `extra` appends the one or two fields each of those adds on
// top (e.g. `website`, `services`, `portfolio_link`).
// Same "business profile" extras Developers has (website, primary location,
// established year, years in business, active/completed projects, office
// hours, social links) — reused by the other directory collections
// (Marketing/Sales Companies, Architects, Interior Designers, Construction
// Companies) so builders/agencies/designers get the same profile depth.
// Co-Developers is intentionally NOT included here — that concept (external
// credits on a joint project) is specific to Developers.
export function businessProfileExtraFields(): Field[] {
  return [
    { name: 'website', type: 'text' },
    { name: 'location', type: 'text', label: 'Primary Location', admin: { description: 'e.g. Colombo 03' } },
    { name: 'establishedYear', type: 'number', label: 'Established Year' },
    { name: 'yearsInBusiness', type: 'number', label: 'Years in Business' },
    { name: 'activeProjects', type: 'number', label: 'Active Projects' },
    { name: 'completedProjects', type: 'number', label: 'Completed Projects' },
    {
      name: 'officeHours',
      type: 'array',
      label: 'Office Hours',
      fields: [
        { name: 'day', type: 'select', required: true, options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        { name: 'open', type: 'checkbox', label: 'Open', defaultValue: false },
        { name: 'from', type: 'text', admin: { condition: (_, siblingData) => Boolean(siblingData?.open) } },
        { name: 'to', type: 'text', admin: { condition: (_, siblingData) => Boolean(siblingData?.open) } },
      ],
    },
    {
      name: 'awards',
      type: 'array',
      label: 'Awards',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'year', type: 'text' },
      ],
    },
    {
      name: 'pressMentions',
      type: 'array',
      label: 'Press Mentions',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'source', type: 'text', required: true },
        { name: 'url', type: 'text' },
        { name: 'date', type: 'text' },
      ],
    },
    socialLinksField,
  ]
}

export function companyProfileFields(extra: Field[] = []): Field[] {
  return [
    { name: 'slug', type: 'text', required: true, unique: true, index: true },
    { name: 'name', type: 'text', required: true },
    { name: 'logo', type: 'text', admin: { description: 'Logo image URL — or upload a file in Media and paste its URL here.' } },
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
    admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'contact_email'], hidden: hiddenUnlessAdmin },
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

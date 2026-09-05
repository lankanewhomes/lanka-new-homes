import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, isAdmin, ownDeveloperAccess, publicRead } from './access'
import {
  amenitiesField,
  BASEMENT_OPTIONS,
  CITY_OPTIONS,
  CONSTRUCTION_STATUS_OPTIONS,
  contactField,
  coordinatesField,
  DISTRICT_OPTIONS,
  ELECTRICITY_OPTIONS,
  FEATURED_PAGE_OPTIONS,
  GARAGE_OPTIONS,
  galleryLikeField,
  historyLogField,
  nearbyField,
  OWNERSHIP_OPTIONS,
  PARKING_TYPE_OPTIONS,
  PLAN_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROVINCE_OPTIONS,
  SECURITY_OPTIONS,
  seoFields,
  selectWithOther,
  TAP_WATER_OPTIONS,
  unitFeaturesField,
} from './shared-fields'
import { scoreProjectBeforeChange } from './hooks/project-scoring'
import { syncProjectToSupabase } from './hooks/sync-to-supabase'

const MAX_VISIBLE_STATS = 10
const maxSelections = (value: unknown) =>
  !Array.isArray(value) || value.length <= MAX_VISIBLE_STATS ? true : `Choose at most ${MAX_VISIBLE_STATS}.`

const PROJECT_STATUS_OPTIONS = [
  'Now Selling',
  'Coming Soon',
  'Under Construction',
  'Launching Soon',
  'Nearly Sold Out',
  'Nearly Complete',
]

// Matches ProjectStatLabel in src/types/index.ts verbatim, including the
// "Total units"/"Total Units" duplicate already present there.
const PROJECT_STAT_LABEL_OPTIONS = [
  'Listing status',
  'Building status',
  'Price CAD',
  'Price range',
  'Address',
  'Total units',
  'Total Units',
  'Floor plans',
  'Stories',
  'Floors',
  'Property type',
  'Beds',
  'Baths',
  'SqFt',
  'Move in',
  'Units sold',
  'Units available',
  'Road',
  'Area',
  'Electricity',
  'Tap water',
  'Per SqFt (Avg)',
  'Incentives',
  'Parking',
  'Carpark levels',
  'Avg unit price',
  'Avg floor area',
  'Ownership',
  'Ceilings',
  'Neighborhood',
  'Security',
  'District',
  'Sales started',
]

const galleryField = galleryLikeField('gallery')

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'developer', 'status', 'startingPriceLkr', 'featured', 'final_score'],
    // `read` access below is deliberately public (the live site needs
    // anonymous access to project data) — that alone would let a developer
    // browsing /cms see every other developer's projects in the list, not
    // just their own. This filters the /cms list view itself down to their
    // own projects, without touching the underlying access (or the public
    // REST API real visitors depend on).
    baseListFilter: async ({ req }) => {
      if (isAdmin(req)) return null
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length > 0 ? { developer: { in: ownedIds } } : null
    },
  },
  access: {
    read: publicRead,
    create: ownDeveloperAccess('developer'),
    update: ownDeveloperAccess('developer'),
    delete: ownDeveloperAccess('developer'),
  },
  hooks: {
    beforeChange: [scoreProjectBeforeChange],
    afterChange: [syncProjectToSupabase],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            { name: 'slug', type: 'text', required: true, unique: true, index: true },
            { name: 'name', type: 'text', required: true },
            { name: 'developer', type: 'relationship', relationTo: 'developers', required: true, index: true },
            { name: 'architect', type: 'relationship', relationTo: 'architects' },
            { name: 'marketing_company', type: 'relationship', relationTo: 'marketing-companies', label: 'Marketing Company' },
            { name: 'sales_company', type: 'relationship', relationTo: 'sales-companies', label: 'Sales Company' },
            { name: 'interior_designer', type: 'relationship', relationTo: 'interior-designers', label: 'Interior Designer' },
            { name: 'location', type: 'text' },
            ...selectWithOther('district', 'District', DISTRICT_OPTIONS),
            ...selectWithOther('city', 'City', CITY_OPTIONS),
            ...selectWithOther('province', 'Province', PROVINCE_OPTIONS),
            { name: 'neighborhood', type: 'relationship', relationTo: 'neighborhoods' },
            { name: 'neighborhood_other', type: 'text', label: 'Neighborhood (Other)', admin: { description: "Custom value, used when the neighborhood above isn't in the system yet." } },
            { name: 'neighborhoodSlug', type: 'text' },
            { name: 'road', type: 'text' },
            { name: 'area', type: 'text' },
            ...selectWithOther('electricity', 'Electricity', ELECTRICITY_OPTIONS),
            ...selectWithOther('tapWater', 'Tap Water', TAP_WATER_OPTIONS),
            ...selectWithOther('type', 'Type', PROJECT_TYPE_OPTIONS),
            ...selectWithOther('ownership', 'Ownership', OWNERSHIP_OPTIONS),
            { name: 'status', type: 'select', options: PROJECT_STATUS_OPTIONS, index: true },
            { name: 'featured', type: 'checkbox', defaultValue: false },
            { name: 'isMoveInNow', type: 'checkbox', defaultValue: false },
            {
              name: 'isVerified',
              type: 'checkbox',
              label: 'Is Verified',
              defaultValue: false,
              admin: { readOnly: true, description: 'Auto-set true once every item on the Verification tab is checked off.' },
            },
            {
              name: 'coDevelopers',
              type: 'array',
              label: 'Co-Developers (external, not in system)',
              admin: { description: 'Free-text credits for co-developers that don’t have a Developer record here.' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'href', type: 'text' },
              ],
            },
            {
              // The `developer` field above is the primary/owning developer
              // (whichever developer dashboard this project belongs to —
              // drives edit access). These are secondary, credit-only.
              name: 'additional_developers',
              type: 'relationship',
              relationTo: 'developers',
              hasMany: true,
              label: 'Additional Developers',
              admin: { description: 'Other developer companies credited on this project (secondary — the primary developer above owns edit access).' },
            },
            {
              name: 'additional_builders',
              type: 'relationship',
              relationTo: 'construction-companies',
              hasMany: true,
              label: 'Additional Builders',
              admin: { description: 'Construction companies / builders credited on this project.' },
            },
          ],
        },
        {
          label: 'Timeline',
          fields: [
            { name: 'launchDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
            { name: 'completionYear', type: 'number' },
            ...selectWithOther('constructionStatus', 'Construction Status', CONSTRUCTION_STATUS_OPTIONS),
            {
              name: 'constructionStagePercent',
              type: 'select',
              label: 'Construction Stage (%)',
              options: ['0%', '10%', '25%', '50%', '75%', '90%', '100%'],
              admin: { description: 'How far along construction is, shown alongside Construction Status.' },
            },
            { name: 'constructionStarted', type: 'date', label: 'Construction Started', admin: { date: { pickerAppearance: 'monthOnly' } } },
            historyLogField('statusHistory', 'Status History'),
            historyLogField('completionDateHistory', 'Completion Date History'),
            historyLogField('availabilityHistory', 'Availability History'),
          ],
        },
        {
          label: 'Pricing',
          fields: [
            { name: 'startingPriceLkr', type: 'number' },
            { name: 'priceRange', type: 'text' },
            { name: 'averageUnitPriceLkr', type: 'number' },
            { name: 'paymentPlan', type: 'textarea' },
            { name: 'paymentPlanItems', type: 'text', hasMany: true },
            { name: 'availablePlanPrices', type: 'text' },
            { name: 'pricingComingSoon', type: 'text' },
            { name: 'propertyTax', type: 'text' },
            { name: 'rentalIncome', type: 'text', label: 'Expected Rental Income', admin: { description: 'Free-text, e.g. "Rs. 45,000–60,000/month" or "8% estimated yield".' } },
            { name: 'parkingCost', type: 'text' },
            { name: 'storageCost', type: 'text' },
            { name: 'coopFeeRealtors', type: 'text' },
            { name: 'depositPaymentStructure', type: 'text' },
            { name: 'incentives', type: 'text', hasMany: true },
            { name: 'includedUtilities', type: 'text', hasMany: true, label: 'Included Utilities' },
            {
              name: 'paidUtilities',
              type: 'array',
              label: 'Paid Utilities',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
              ],
            },
            historyLogField('pricingHistory', 'Pricing History'),
          ],
        },
        {
          label: 'Building Details',
          fields: [
            { name: 'bedrooms', type: 'text' },
            { name: 'bathrooms', type: 'text' },
            { name: 'floorAreaRange', type: 'text' },
            { name: 'averageFloorAreaSqFt', type: 'number' },
            { name: 'units', type: 'number' },
            { name: 'floors', type: 'number' },
            { name: 'carparkLevels', type: 'number' },
            { name: 'parkingCount', type: 'number', label: 'Parking Count' },
            ...selectWithOther('parkingType', 'Parking Type', PARKING_TYPE_OPTIONS),
            { name: 'parking', type: 'text', label: 'Parking (Note)', admin: { description: 'Free-text description, e.g. "Laneway/rear access, Driveway" — shown alongside Parking Count/Type above.' } },
            ...selectWithOther('security', 'Security', SECURITY_OPTIONS),
            { name: 'ceilingInfo', type: 'text' },
            { name: 'averagePricePerSqft', type: 'text' },
            { name: 'monthlyMaintenancePerSqft', type: 'text' },
          ],
        },
        {
          label: 'Content & Media',
          fields: [
            { name: 'summary', type: 'textarea' },
            { name: 'description', type: 'textarea' },
            { name: 'heroImage', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
            galleryField,
            { name: 'brochureUrl', type: 'text', label: 'Brochure URL', admin: { description: 'PDF URL — or upload a file in Media and paste its URL here.' } },
            {
              name: 'videos',
              type: 'array',
              fields: [
                { name: 'label', type: 'text' },
                { name: 'embedUrl', type: 'text', label: 'Embed URL', admin: { description: 'YouTube/Vimeo link — or upload a video file in Media and paste its URL here.' } },
                { name: 'thumbnail', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
              ],
            },
            {
              name: 'virtualTours',
              type: 'array',
              fields: [
                { name: 'label', type: 'text' },
                { name: 'url', type: 'text', required: true, admin: { description: 'Matterport/embed link — or upload a file in Media and paste its URL here.' } },
              ],
            },
            { name: 'interactiveMapUrl', type: 'text', admin: { description: 'Embed link (e.g. Google My Maps) — or upload a file in Media and paste its URL here.' } },
            {
              // Same access level as floorPlanVisibleStats (Floor Plans
              // tab) — developer/builder-editable, not admin-only.
              name: 'mobileVisibleStats',
              type: 'select',
              hasMany: true,
              options: PROJECT_STAT_LABEL_OPTIONS,
              validate: maxSelections,
              admin: { description: 'Which detail chips show in the listing icon stats on mobile. Maximum 10.' },
            },
            {
              name: 'desktopVisibleStats',
              type: 'select',
              hasMany: true,
              options: PROJECT_STAT_LABEL_OPTIONS,
              validate: maxSelections,
              admin: { description: 'Which detail chips show in the listing icon stats on desktop. Maximum 10.' },
            },
          ],
        },
        {
          label: 'Amenities & Features',
          fields: [
            amenitiesField,
            unitFeaturesField,
          ],
        },
        {
          label: 'Floor Plans',
          fields: [
            {
              name: 'floorPlans',
              type: 'array',
              fields: [
                { name: 'planName', type: 'text', required: true },
                ...selectWithOther('planType', 'Plan Type', PLAN_TYPE_OPTIONS),
                { name: 'bedrooms', type: 'number', required: true },
                { name: 'bathrooms', type: 'number', required: true },
                { name: 'floorAreaSqFt', type: 'number', required: true },
                { name: 'interiorSizeSqFt', type: 'number' },
                { name: 'balconySizeSqFt', type: 'number' },
                ...selectWithOther('basement', 'Basement', BASEMENT_OPTIONS),
                ...selectWithOther('garage', 'Garage', GARAGE_OPTIONS),
                { name: 'parkingSpaces', type: 'number' },
                ...selectWithOther('parkingType', 'Parking Type', PARKING_TYPE_OPTIONS),
                { name: 'startingPriceLkr', type: 'number', required: true },
                { name: 'image', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
                {
                  name: 'availability',
                  type: 'select',
                  options: ['Available', 'Limited', 'Sold Out'],
                  defaultValue: 'Available',
                },
                { name: 'quickMoveIn', type: 'checkbox', defaultValue: false },
              ],
            },
            {
              // Same access level (developer/builder-editable) and option
              // list as mobile/desktopVisibleStats (Content & Media tab) —
              // this one lives here on Floor Plans since that's the page it
              // controls.
              name: 'floorPlanVisibleStats',
              type: 'select',
              label: 'Floor Plan Page Icon Visibility',
              hasMany: true,
              options: PROJECT_STAT_LABEL_OPTIONS,
              validate: maxSelections,
              admin: { description: 'Which detail chips show on the floor plan page. Maximum 10.' },
            },
            {
              name: 'hotDeal',
              type: 'group',
              fields: [
                { name: 'enabled', type: 'checkbox', defaultValue: false },
                { name: 'badge', type: 'text' },
                { name: 'title', type: 'text' },
                { name: 'description', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Neighborhood',
          fields: [nearbyField],
        },
        {
          label: 'Location & Contact',
          fields: [coordinatesField, contactField],
        },
        {
          label: 'Scoring & Placement',
          fields: [
            {
              name: 'completeness_score',
              type: 'number',
              label: 'Completeness Score',
              defaultValue: 0,
              admin: { readOnly: true, description: 'Auto-calculated from how many key fields are filled in.' },
            },
            { name: 'view_count', type: 'number', label: 'View Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "view" events for this project.' } },
            { name: 'save_count', type: 'number', label: 'Save Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "save" events (logged automatically when a Saved Listing is created).' } },
            { name: 'lead_count', type: 'number', label: 'Lead Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "lead_submitted" events (logged automatically when a Lead is created).' } },
            { name: 'download_count', type: 'number', label: 'Download Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "brochure_download" events for this project.' } },
            { name: 'phone_click_count', type: 'number', label: 'Phone Click Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "phone_click" events for this project.' } },
            {
              // A project can be paid-featured on more than one page at
              // once (e.g. sitewide AND colombo), each on its own window —
              // one entry per confirmed featured_listing Payment (see
              // hooks/activate-placement.ts). `featured` above is just a
              // quick "is this featured anywhere" glance flag.
              name: 'placements',
              type: 'array',
              label: 'Placements',
              admin: { description: 'Paid featured placements — one row per page/window, added automatically when a featured_listing payment is confirmed.' },
              fields: [
                { name: 'page', type: 'select', required: true, options: FEATURED_PAGE_OPTIONS },
                { name: 'start_date', type: 'date', label: 'Start Date' },
                { name: 'end_date', type: 'date', label: 'End Date' },
                { name: 'source_payment', type: 'relationship', relationTo: 'payments', label: 'Source Payment', admin: { readOnly: true } },
              ],
            },
            {
              name: 'paid_boost',
              type: 'number',
              label: 'Paid Boost',
              defaultValue: 0,
              admin: { description: 'Manually set by admin — added into final_score to rank this project higher.' },
            },
            {
              name: 'final_score',
              type: 'number',
              label: 'Final Score',
              defaultValue: 0,
              admin: { readOnly: true, description: 'Auto-calculated: completeness + engagement + recency + paid_boost.' },
            },
          ],
        },
        {
          label: 'Analytics',
          fields: [
            {
              name: 'analyticsPanel',
              type: 'ui',
              admin: {
                components: { Field: '@/components/payload/ListingAnalyticsPanel#ListingAnalyticsPanel' },
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [seoFields],
        },
        {
          // Admin-only checklist (docs/roadmap.md "Listing verification" —
          // "something I'd strongly recommend for Sri Lanka"). isVerified
          // (Overview tab) auto-flips true once every item here is
          // checked — see hooks/project-scoring.ts.
          label: 'Verification',
          fields: [
            { name: 'verification_developer_verified', type: 'checkbox', label: 'Developer Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_address_verified', type: 'checkbox', label: 'Address Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_price_verified', type: 'checkbox', label: 'Price Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_floor_plans_verified', type: 'checkbox', label: 'Floor Plans Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_completion_date_verified', type: 'checkbox', label: 'Completion Date Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_ownership_verified', type: 'checkbox', label: 'Ownership Verified', access: { read: adminOnlyField, update: adminOnlyField } },
            { name: 'verification_documents_verified', type: 'checkbox', label: 'Documents Verified', access: { read: adminOnlyField, update: adminOnlyField } },
          ],
        },
      ],
    },
  ],
}

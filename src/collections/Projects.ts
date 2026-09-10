import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, getRole, isAdmin, ownDeveloperAccess, publicRead } from './access'
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
  FLOOR_PLAN_VIEW_OPTIONS,
  ASPECT_OPTIONS,
  HANDOVER_CONDITION_OPTIONS,
  FURNISHING_OPTIONS,
  AC_PROVISION_OPTIONS,
  HOT_WATER_OPTIONS,
  YES_NO_OPTIONS,
  PLAN_TYPE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  PROVINCE_OPTIONS,
  SECURITY_OPTIONS,
  seoFields,
  selectWithOther,
  socialLinksField,
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
  'Completed',
]

const PAYMENT_PLAN_BADGE_OPTIONS = [
  'Flexible Payment Plan',
  '0% Down Payment',
  'Easy Installments',
  'Interest-Free Installments',
  'Early Bird Pricing',
]

const AVAILABILITY_BADGE_OPTIONS = ['Limited Units', 'Last Few Units']

// Deliberately excludes anything with its own dedicated field already:
// "Featured" (its own checkbox, drives sort/scoring), status values (the
// Status select above), ownership types and amenities (Ownership/Amenities
// fields) — this is only for badges with no existing home.
const MARKETING_BADGE_OPTIONS = [
  'Premium',
  'Luxury',
  'Exclusive',
  'Popular',
  'Best Seller',
  'Special Offer',
  'Price Reduced',
  'Early Bird',
  'Investor Friendly',
  'High Rental Potential',
  'BOI Approved Project',
]

const LOCATION_BADGE_OPTIONS = ['Beachfront', 'Ocean View', 'City View', 'Mountain View', 'Nature View', 'Prime Location']

// Values match ProjectStatLabel in src/types/index.ts verbatim (they are a
// Postgres enum — never rename a value, only its label). Labels are the
// names the chips actually show on the page (STAT_DISPLAY_LABEL in
// components.tsx), so an editor picks "Move-in year" and sees "Move-in year".
// Leaving every picker empty gives the default chip set documented in
// docs/design.md ("Stats chips vs fact sheet").
const PROJECT_STAT_LABEL_OPTIONS = [
  { label: 'Price range', value: 'Price range' },
  { label: 'Property type', value: 'Property type' },
  { label: 'Beds', value: 'Beds' },
  { label: 'Baths', value: 'Baths' },
  { label: 'SqFt', value: 'SqFt' },
  { label: 'Listing status', value: 'Listing status' },
  { label: 'Move-in year', value: 'Move in' },
  { label: 'Total units', value: 'Total Units' },
  { label: 'Floors', value: 'Floors' },
  { label: 'Construction status', value: 'Building status' },
  { label: 'Address', value: 'Address' },
  { label: 'Units sold', value: 'Units sold' },
  { label: 'Units available', value: 'Units available' },
  { label: 'Floor plans', value: 'Floor plans' },
  { label: 'Road', value: 'Road' },
  { label: 'Area', value: 'Area' },
  { label: 'Electricity', value: 'Electricity' },
  { label: 'Tap water', value: 'Tap water' },
  { label: 'Incentives', value: 'Incentives' },
  { label: 'Parking', value: 'Parking' },
  { label: 'Carpark levels', value: 'Carpark levels' },
  { label: 'Avg unit price', value: 'Avg unit price' },
  { label: 'Avg floor area', value: 'Avg floor area' },
  { label: 'Ownership', value: 'Ownership' },
  { label: 'Ceilings', value: 'Ceilings' },
  { label: 'Security', value: 'Security' },
  { label: 'District', value: 'District' },
  { label: 'Sales started', value: 'Sales started' },
  { label: 'Neighborhood', value: 'Neighborhood' },
  // Retired values — kept only because they exist in the enum. None of
  // these renders a chip any more: "Per SqFt (Avg)" was a derived number
  // (price ÷ first plan's size), the rest are legacy aliases.
  { label: 'Per SqFt (Avg) — retired, no longer shown', value: 'Per SqFt (Avg)' },
  { label: 'Total units (legacy alias — use "Total units")', value: 'Total units' },
  { label: 'Stories (legacy alias — use "Floors")', value: 'Stories' },
  { label: 'Price CAD (legacy — unused)', value: 'Price CAD' },
]

const STAT_PICKER_DEFAULTS_NOTE =
  'Leave empty for the default set: Price range, Property type, Beds, Baths, SqFt, Listing status, Move-in year, Total units (or Floors). Everything else shows in the details table under Overview; pick it here only if it must also be a chip.'

const galleryField = galleryLikeField('gallery')
const commercialAreasField = galleryLikeField('commercialAreas', 'Commercial Areas')

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    useAsTitle: 'name',
    group: 'Properties',
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
    beforeValidate: [
      // A developer creating a project from /cms belongs to exactly one
      // company, so fill `developer` in for them when it's left blank
      // (pairs with ownDeveloperAccess, which only checks the relation
      // when one is submitted). Admins choose freely.
      async ({ data, operation, req }) => {
        if (operation !== 'create' || !data || data.developer || isAdmin(req) || getRole(req) !== 'developer') return data
        const [ownedId] = await getOwnedDeveloperIds(req)
        return ownedId ? { ...data, developer: ownedId } : data
      },
    ],
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
            // Live completeness to-do list (src/lib/completeness.ts) — same
            // checks the scoring hook stores as completeness_score on save.
            { name: 'completeness_todo', type: 'ui', admin: { components: { Field: '@/components/payload/CompletenessTodo#CompletenessTodo' } } },
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
            {
              name: 'isPublished',
              type: 'checkbox',
              label: 'Published (visible on live site)',
              defaultValue: false,
              admin: {
                description:
                  'Off by default for new listings — while off, this project is hidden from the live site (listings, search, sitemap) but still viewable at the Preview Link field below. Turn on when ready to go live.',
              },
            },
            {
              name: 'previewLinkPanel',
              type: 'ui',
              label: 'Preview Link',
              admin: {
                components: { Field: '@/components/payload/PreviewLinkPanel#PreviewLinkPanel' },
              },
            },
          ],
        },
        {
          label: 'Status & Badges',
          fields: [
            { name: 'status', type: 'select', options: PROJECT_STATUS_OPTIONS, index: true },
            {
              name: 'completionYear',
              type: 'number',
              label: 'Move-In Year',
              admin: {
                description: 'Shown as a "Move in {year}" badge on the listing while the year is still ahead.',
                // Year-grid picker instead of a bare number box (YearPickerField).
                components: { Field: '@/components/payload/YearPickerField#YearPickerField' },
              },
            },
            { name: 'featured', type: 'checkbox', defaultValue: false },
            { name: 'isMoveInNow', type: 'checkbox', label: 'Move in now', defaultValue: false },
            { name: 'isDesignBuild', type: 'checkbox', label: 'Design & Build', defaultValue: false, admin: { description: 'This project was delivered under a Design & Build contract model.' } },
            {
              name: 'isVerified',
              type: 'checkbox',
              label: 'Is Verified',
              defaultValue: false,
              admin: { readOnly: true, description: 'Auto-set true once every item on the Verification tab is checked off.' },
            },
            ...selectWithOther(
              'paymentPlanBadge',
              'Payment Plan Badge',
              PAYMENT_PLAN_BADGE_OPTIONS,
              'Optional — shows as a badge on the listing card, same way Featured does. Free to set, no payment required (like Featured, you can grant it directly).',
            ),
            ...selectWithOther(
              'availabilityBadge',
              'Availability Badge',
              AVAILABILITY_BADGE_OPTIONS,
              'Optional — shows as a badge alongside the others (e.g. "Only 3 units left" via Other).',
            ),
            {
              name: 'marketingBadges',
              type: 'select',
              label: 'Marketing Badges',
              hasMany: true,
              options: MARKETING_BADGE_OPTIONS,
              admin: { description: 'Pick any that apply — each shows as its own badge on the listing, same style as Featured. Note: "Status" (Coming Soon/Now Selling/etc.) and property features (Freehold, Pool, Gym, Security, EV Charging, Gated Community...) already have their own dedicated fields (Overview tab\'s Status, and Ownership/Amenities) — no need to duplicate those here.' },
            },
            {
              name: 'locationBadges',
              type: 'select',
              label: 'Location Badges',
              hasMany: true,
              options: LOCATION_BADGE_OPTIONS,
              admin: { description: 'Pick any that apply — shows alongside the other badges on the listing.' },
            },
            {
              type: 'collapsible',
              label: 'Hot Deal Banner',
              admin: { initCollapsed: true, className: 'status-verification-collapsible' },
              fields: [
                { name: 'hotDeal', type: 'group', fields: [
                  { name: 'enabled', type: 'checkbox', defaultValue: false },
                  { name: 'badge', type: 'text' },
                  { name: 'title', type: 'text' },
                  { name: 'description', type: 'text' },
                ] },
              ],
            },
          ],
        },
        {
          label: 'Timeline',
          fields: [
            { name: 'launchDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
            ...selectWithOther('constructionStatus', 'Construction Status', CONSTRUCTION_STATUS_OPTIONS),
            {
              name: 'constructionStagePercent',
              type: 'select',
              label: 'Construction Stage (%)',
              options: ['0%', '10%', '25%', '50%', '75%', '90%', '100%'],
              admin: { description: 'How far along construction is, shown alongside Construction Status.' },
            },
            { name: 'constructionStarted', type: 'date', label: 'Construction Started', admin: { date: { pickerAppearance: 'monthOnly' } } },
            {
              name: 'constructionUpdates',
              type: 'array',
              label: 'Construction Updates',
              admin: { description: 'A dated photo + note showing construction progress — shown as a timeline on the project page.' },
              fields: [
                { name: 'date', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayOnly' } } },
                { name: 'image', type: 'text', required: true, admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
                { name: 'note', type: 'text' },
              ],
            },
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
            { name: 'units', type: 'number', label: 'Total Units' },
            { name: 'availableUnits', type: 'number', label: 'Available Units' },
            { name: 'bookedUnits', type: 'number', label: 'Booked Units' },
            { name: 'soldUnits', type: 'number', label: 'Sold Units' },
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
            { name: 'highlights', type: 'text', hasMany: true, label: 'Key Highlights', admin: { description: '3-5 short standout points shown above the Overview text (e.g. "South Asia\'s highest sky bridge").' } },
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
            { name: 'streetViewUrl', type: 'text', label: 'Street View URL', admin: { description: "Optional — paste a specific Google Street View embed link (from Google Maps' Share > Embed a map) to override the default view generated from Coordinates above." } },
            { name: 'view360Url', type: 'text', label: '360° View URL', admin: { description: 'Embed link (e.g. a 360° panorama tour) — or upload an image/file in Media and paste its URL here.' } },
            socialLinksField,
            {
              // Same access level as floorPlanVisibleStats (Floor Plans
              // tab) — developer/builder-editable, not admin-only.
              name: 'mobileVisibleStats',
              type: 'select',
              hasMany: true,
              options: PROJECT_STAT_LABEL_OPTIONS,
              validate: maxSelections,
              admin: { description: `Which detail chips show on mobile. Maximum 10. Leave empty for the first six of the desktop set.` },
            },
            {
              name: 'desktopVisibleStats',
              type: 'select',
              hasMany: true,
              options: PROJECT_STAT_LABEL_OPTIONS,
              validate: maxSelections,
              admin: { description: `Which detail chips show on desktop. Maximum 10. ${STAT_PICKER_DEFAULTS_NOTE}` },
            },
          ],
        },
        {
          label: 'Amenities & Features',
          fields: [
            amenitiesField,
            unitFeaturesField,
            commercialAreasField,
          ],
        },
        {
          // Sinhala / Tamil versions of the free-text copy. The fixed labels
          // (Beds, Price range, statuses…) are translated in code
          // (src/lib/i18n/listing-strings.ts); only prose needs entering
          // here. Empty = the English text is shown for that language.
          label: 'Translations',
          fields: [
            {
              name: 'translations',
              type: 'group',
              fields: (['si', 'ta'] as const).map((code) => ({
                name: code,
                type: 'group' as const,
                label: code === 'si' ? 'සිංහල (Sinhala)' : 'தமிழ் (Tamil)',
                fields: [
                  { name: 'summary', type: 'textarea' as const, label: 'Summary' },
                  { name: 'highlights', type: 'text' as const, hasMany: true, label: 'Key Highlights' },
                  { name: 'description', type: 'textarea' as const, label: 'Description' },
                ],
              })),
            },
          ],
        },
        {
          label: 'Floor Plans',
          fields: [
            {
              name: 'floorPlans',
              type: 'array',
              // Field set extended 2026-09-08 for the plan page's fact sheet
              // and chips (docs/design.md "Floor plan page facts & chips").
              // Every figure is the developer's own — never compute one
              // (Standing Rule 4); leave a field empty and it simply doesn't
              // render.
              fields: [
                { name: 'planName', type: 'text', required: true },
                ...selectWithOther('planType', 'Plan Type', PLAN_TYPE_OPTIONS),
                { name: 'bedrooms', type: 'number', required: true },
                { name: 'bathrooms', type: 'number', required: true },
                { name: 'ensuiteBaths', type: 'number', label: 'Ensuite Baths' },
                { name: 'powderRooms', type: 'number', label: 'Powder Rooms' },
                { name: 'floorAreaSqFt', type: 'number', required: true, label: 'Total SqFt' },
                { name: 'interiorSizeSqFt', type: 'number', label: 'Interior SqFt' },
                { name: 'balconySizeSqFt', type: 'number', label: 'Balcony SqFt' },
                { name: 'terraceSqFt', type: 'number', label: 'Terrace SqFt' },
                { name: 'landPerches', type: 'number', label: 'Land Extent (perches)', admin: { description: 'For villas / houses with their own plot — as published, e.g. 8.15.' } },
                { name: 'ceilingHeight', type: 'text', label: 'Ceiling Height', admin: { description: 'As published, e.g. "3.0 m" or "10 ft".' } },
                { name: 'floorRange', type: 'text', label: 'Floor Range', admin: { description: 'Which floors this plan sits on, e.g. "5–12" or "Ground".' } },
                ...selectWithOther('aspect', 'Aspect', ASPECT_OPTIONS),
                ...selectWithOther('view', 'View', FLOOR_PLAN_VIEW_OPTIONS),
                { name: 'cornerUnit', type: 'checkbox', label: 'Corner Unit', defaultValue: false },
                { name: 'startingPriceLkr', type: 'number', required: true, label: 'Price (LKR)' },
                { name: 'pricePerSqFtLkr', type: 'number', label: 'Price per SqFt (LKR)', admin: { description: "Only if the developer publishes it — don't divide price by size." } },
                { name: 'maintenancePerMonthLkr', type: 'number', label: 'Maintenance per Month (LKR)' },
                { name: 'deposit', type: 'text', label: 'Deposit', admin: { description: 'As published, e.g. "30% on reservation".' } },
                { name: 'parkingSpaces', type: 'number', label: 'Parking Spaces' },
                ...selectWithOther('parkingType', 'Parking Type', PARKING_TYPE_OPTIONS),
                ...selectWithOther('basement', 'Basement', BASEMENT_OPTIONS),
                ...selectWithOther('garage', 'Garage', GARAGE_OPTIONS),
                ...selectWithOther('storage', 'Storage', YES_NO_OPTIONS),
                ...selectWithOther('utilityArea', 'Utility Area', YES_NO_OPTIONS),
                ...selectWithOther('maidsRoom', "Maid's Room", YES_NO_OPTIONS),
                ...selectWithOther('pantry', 'Pantry', YES_NO_OPTIONS),
                ...selectWithOther('handoverCondition', 'Handover Condition', HANDOVER_CONDITION_OPTIONS),
                ...selectWithOther('furnishing', 'Furnishing', FURNISHING_OPTIONS),
                ...selectWithOther('acProvision', 'AC Provision', AC_PROVISION_OPTIONS),
                ...selectWithOther('hotWater', 'Hot Water', HOT_WATER_OPTIONS),
                { name: 'floorFinish', type: 'text', label: 'Floor Finish', admin: { description: 'e.g. "Porcelain tiles", "Engineered timber".' } },
                { name: 'unitsInPlan', type: 'number', label: 'Units in Plan', admin: { description: 'How many units in the building use this plan.' } },
                { name: 'unitsAvailable', type: 'number', label: 'Units Available' },
                { name: 'image', type: 'text', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
                { name: 'image3d', type: 'text', label: '3D View Image', admin: { description: 'Optional 3D render of this plan. When set, the plan page shows a 2D/3D pair in the hero and lightbox.' } },
                { name: 'imageMetric', type: 'text', label: 'Floor Plan Image (m²)', admin: { description: 'Optional second drawing of the same plan in metres (some developers publish ft² and m² versions). Shown after the main drawing on the plan page.' } },
                {
                  name: 'planDocuments',
                  type: 'array',
                  label: 'Plan Downloads',
                  admin: { description: 'Downloadable versions of this plan the developer publishes — e.g. "Floor plan (ft²)" and "Floor plan (m²)" PDFs or images.' },
                  fields: [
                    { name: 'label', type: 'text', required: true },
                    { name: 'url', type: 'text', required: true, admin: { description: 'File URL — or upload a file in Media and paste its URL here.' } },
                  ],
                },
                {
                  name: 'availability',
                  type: 'select',
                  options: ['Available', 'Limited', 'Sold Out'],
                  defaultValue: 'Available',
                },
                { name: 'quickMoveIn', type: 'checkbox', defaultValue: false },
                {
                  // Developer's own per-floor sold/available tracker for this
                  // plan (e.g. Rush Lanka's "View Availability" popup). Feeds
                  // the "Available on floors" line on the plan page.
                  name: 'floorAvailability',
                  type: 'array',
                  label: 'Floor Availability',
                  admin: { description: 'One row per floor this plan sits on — tick the ones still available.' },
                  fields: [
                    { name: 'floor', type: 'text', required: true },
                    { name: 'available', type: 'checkbox', defaultValue: true },
                  ],
                },
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
              admin: { description: 'Legacy — floor plan pages now use a fixed chip set (docs/design.md "Floor plan page facts & chips"); this only still affects land plot pages. Maximum 10.' },
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
            { name: 'whatsapp_click_count', type: 'number', label: 'WhatsApp Click Count', defaultValue: 0, admin: { description: 'Auto-incremented from Analytics "whatsapp_click" events for this project (the WhatsApp button beside "Request info").' } },
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

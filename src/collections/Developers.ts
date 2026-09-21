import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, getRole, isAdmin, publicRead } from './access'
import { companyProfileFields, seoFields, socialLinksField } from './shared-fields'
import { syncDeveloperDeleteToSupabase, syncDeveloperToSupabase } from './hooks/sync-to-supabase'

export const Developers: CollectionConfig = {
  slug: 'developers',
  admin: {
    useAsTitle: 'name',
    group: 'Companies & Professionals',
    defaultColumns: ['name', 'slug', 'user'],
    // Same idea as Projects' baseListFilter — read access is public (real
    // visitors need the whole directory), but a developer's own /cms list
    // view should default to just their own company, not every developer.
    baseListFilter: async ({ req }) => {
      if (isAdmin(req)) return null
      const ownedIds = await getOwnedDeveloperIds(req)
      // A `null` filter means "no restriction" to Payload — returning it for
      // an account with zero owned companies (e.g. a developer account not
      // yet linked to one) exposed every developer's profile in the /cms
      // list view. -1 is the established "matches no real row" sentinel for
      // an integer id column (same convention as AdminDashboard.tsx/
      // Subscriptions.ts) — the safe default is to show nothing, not everything.
      return { id: { in: ownedIds.length > 0 ? ownedIds : [-1] } }
    },
  },
  access: {
    read: publicRead,
    // An admin can create any profile. A developer-role account with no
    // company profile of their own yet can self-register one (self-service
    // signup) — forced to status: 'pending' and linked to themselves by
    // the beforeChange hook below, same "self-service create, admin
    // approves" pattern as Payments/HeroSlides. A developer who already
    // owns a profile can't create a second one.
    create: async ({ req }) => {
      if (isAdmin(req)) return true
      if (getRole(req) !== 'developer') return false
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length === 0
    },
    // Delete and verification/ownership changes (below) stay admin-only —
    // the linked developer account can edit everything else about their
    // own profile.
    update: async ({ req }) => {
      if (isAdmin(req)) return true
      const ownedIds = await getOwnedDeveloperIds(req)
      return ownedIds.length > 0 ? { id: { in: ownedIds } } : false
    },
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        if (operation === 'create' && !isAdmin(req)) {
          return { ...data, user: req.user ? req.user.id : undefined, verification_status: 'pending' }
        }
        return data
      },
    ],
    afterChange: [syncDeveloperToSupabase],
    afterDelete: [syncDeveloperDeleteToSupabase],
  },
  fields: [
    ...companyProfileFields([{ name: 'website', type: 'text' }, { name: 'location', type: 'text', label: 'Primary Location', admin: { description: 'e.g. Colombo 03' } }]),
    { name: 'establishedYear', type: 'number', label: 'Established Year' },
    { name: 'yearsInBusiness', type: 'number', label: 'Years in Business' },
    { name: 'activeProjects', type: 'number', label: 'Active Projects' },
    { name: 'completedProjects', type: 'number', label: 'Completed Projects' },
    {
      name: 'coDevelopers',
      type: 'array',
      label: 'Co-Developers (external, not in system)',
      admin: { description: 'Free-text credits for co-developers that don’t have a Developer record here — shown on the public builder page.' },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'href', type: 'text' },
      ],
    },
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
      // Same shape as the awards block the other directory collections already
      // have (businessProfileExtraFields) — added to Developers 2026-09-21 so
      // credentials (CIDA grade, ISO, Great Place to Work…) show on the
      // profile's Awards tab, which already renders `awards`.
      name: 'awards',
      type: 'array',
      label: 'Awards & Certifications',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'issuer', type: 'text' },
        { name: 'year', type: 'text' },
        { name: 'description', type: 'textarea' },
        { name: 'imageUrl', type: 'text', label: 'Image URL', admin: { description: 'Image URL — or upload a file in Media and paste its URL here.' } },
        { name: 'url', type: 'text', label: 'Learn More Link', admin: { description: 'Optional — link to the award announcement/press release.' } },
      ],
    },
    socialLinksField,
    {
      name: 'lead_alerts',
      type: 'group',
      label: 'Lead alerts',
      admin: {
        description:
          'Every new inquiry on one of your projects is emailed — and sent by WhatsApp once the WhatsApp Business API is connected — the moment it comes in, with the buyer’s details and one-tap reply links.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', label: 'Send instant lead alerts', defaultValue: true },
        {
          name: 'email',
          type: 'email',
          label: 'Alert email',
          admin: { description: 'Leave blank to use the Contact Email above (or the linked account’s login email).' },
        },
        {
          name: 'whatsapp',
          type: 'text',
          label: 'Alert WhatsApp number',
          admin: { description: 'International format, e.g. +94 77 123 4567. Leave blank to use the WhatsApp number under Social Links.' },
        },
      ],
    },
    {
      // Written only by src/lib/response-badge.ts (recomputed when a lead is
      // first answered and weekly) — never by hand, that's the point of it.
      name: 'response_stats',
      type: 'group',
      label: 'Response time (auto)',
      access: { update: adminOnlyField },
      admin: {
        description:
          'Earned, not entered: over the last 90 days, at least 5 leads old enough to judge and 80% of them answered (moved off "New") within an hour. Shows as a "Responds within 1 hour" badge on the profile and every listing.',
      },
      fields: [
        { name: 'responds_within_hour', type: 'checkbox', label: 'Responds within 1 hour badge', defaultValue: false, admin: { readOnly: true } },
        { name: 'within_hour_rate', type: 'number', label: 'Answered within 1 hour (%)', admin: { readOnly: true } },
        { name: 'median_minutes', type: 'number', label: 'Median first response (minutes)', admin: { readOnly: true } },
        { name: 'sample_size', type: 'number', label: 'Leads judged (last 90 days)', admin: { readOnly: true } },
        { name: 'computed_at', type: 'date', label: 'Last computed', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      hasMany: false,
      filterOptions: { role: { equals: 'developer' } },
      access: { update: adminOnlyField },
      admin: {
        description:
          'The developer-role account that manages this company profile. Leave blank when pre-building a profile before the developer has an account — if they later sign up with this Contact Email, they auto-claim it (and everything created under it, including projects); otherwise set this manually once they exist.',
      },
    },
    { name: 'projects', type: 'join', collection: 'projects', on: 'developer' },
    { name: 'team_members', type: 'join', collection: 'team-members', on: 'company', label: 'Team Members' },
    {
      name: 'verification_status',
      type: 'select',
      label: 'Verification Status',
      defaultValue: 'pending',
      options: ['pending', 'approved', 'rejected', 'changes_requested'],
      access: { update: adminOnlyField },
      admin: { description: 'Gates the "Developer approval" workflow — new self-registered developers start pending.' },
    },
    seoFields,
  ],
}

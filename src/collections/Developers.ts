import type { CollectionConfig, Where } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, getRole, isAdmin, publicRead } from './access'
import { companyProfileFields, seoFields, socialLinksField } from './shared-fields'
import { syncDeveloperDeleteToSupabase, syncDeveloperToSupabase } from './hooks/sync-to-supabase'
import { syncFeaturedProjectsFromDeveloper } from './hooks/sync-developer-plan'
import { maxFeaturedProjects, PACKAGE_LIST } from '@/lib/packages'
import { checkEmailAgainstWebsite, websiteDomain } from '@/lib/developer-domain-verification'

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
      // Verified Developer is tied to the company website's domain: change the website to a different domain and the
      // badge is revoked until a company-domain email is confirmed again (subdomains of the old domain still count).
      ({ data, originalDoc, operation }) => {
        if (operation !== 'update' || !originalDoc?.domain_verified || data.website === undefined || data.domain_verified === false) return data
        if (websiteDomain(data.website) === websiteDomain(originalDoc.website)) return data
        const vd = data.verified_domain ?? originalDoc.verified_domain
        if (vd && checkEmailAgainstWebsite(`x@${vd}`, data.website).ok) return data
        return { ...data, domain_verified: false, verified_domain: null, verified_email: null, verified_at: null }
      },
    ],
    // syncFeaturedProjectsFromDeveloper runs after every save (not just
    // plan/featuredProjectIds changes) — see its own comment for why that's
    // fine. Runs before the Supabase sync so a plan/slot change is already
    // reflected on each project's `.package` by the time Projects' own
    // afterChange hook mirrors that project to Supabase.
    afterChange: [syncFeaturedProjectsFromDeveloper, syncDeveloperToSupabase],
    afterDelete: [syncDeveloperDeleteToSupabase],
  },
  fields: [
    ...companyProfileFields([{ name: 'website', type: 'text' }, { name: 'location', type: 'text', label: 'Primary Location', admin: { description: 'e.g. Colombo 03' } }]),
    { name: 'establishedYear', type: 'number', label: 'Established Year' },
    { name: 'yearsInBusiness', type: 'number', label: 'Years in Business' },
    { name: 'activeProjects', type: 'number', label: 'Active Projects' },
    { name: 'completedProjects', type: 'number', label: 'Completed Projects' },
    {
      // Counters exactly as the company prints them on its own website ("100+", "13+"). Text, not numbers, so the "+" survives.
      name: 'siteStats',
      type: 'group',
      label: 'Company stats (as published on the company site)',
      admin: { description: 'Shown as a stat row on the public developer page. Copy the wording the company itself prints, e.g. "100+". Leave blank for any stat the company does not publish.' },
      fields: [
        { name: 'completed', type: 'text', label: 'Completed projects' },
        { name: 'ongoing', type: 'text', label: 'Ongoing projects' },
        { name: 'soldOut', type: 'text', label: 'Sold-out projects' },
        { name: 'years', type: 'text', label: 'Years in business' },
      ],
    },
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
          'Earned, not entered: over the last 90 days, at least 5 leads old enough to judge and 80% of them answered (moved off "New") within 24 hours. Shows as a "Responds within 24 hours" badge on the profile and every listing. (Field names below keep their original "hour" wording — internal only, not user-facing.)',
      },
      fields: [
        { name: 'responds_within_hour', type: 'checkbox', label: 'Responds within 24 hours badge', defaultValue: false, admin: { readOnly: true } },
        { name: 'within_hour_rate', type: 'number', label: 'Answered within 24 hours (%)', admin: { readOnly: true } },
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
      // Billing moved from per-project to per-developer 2026-09-24 — a
      // company buys ONE plan here, not a package per project. Set
      // automatically from an active Subscription
      // (hooks/sync-developer-plan.ts) when payment is confirmed; not
      // meant to be hand-edited except for an admin manually granting one.
      name: 'plan',
      type: 'select',
      label: 'Plan',
      defaultValue: 'free',
      options: [...PACKAGE_LIST.map((p) => p.tier)],
      access: { update: adminOnlyField },
      admin: {
        description: "This company's current plan — drives which of the projects in Featured Projects (below) actually show as featured. Set automatically from an active Subscription.",
      },
    },
    {
      name: 'featuredUntil',
      type: 'date',
      label: 'Featured Until',
      access: { update: adminOnlyField },
      admin: {
        description: "When the current plan (and every featured placement below) expires — the active Subscription's renewal date. Past this date every project reverts to Free until the plan renews.",
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'extra_featured_slots',
      type: 'number',
      label: 'Extra Featured Slots (purchased)',
      defaultValue: 0,
      access: { update: adminOnlyField },
      admin: {
        description: "Mirrors the active Subscription's extra_featured_slots — additional featured-project slots bought beyond the plan's included amount, at that plan's per-extra-slot price (see src/lib/packages.ts).",
      },
    },
    {
      // The developer's own choice — which of THEIR projects use their
      // plan's included (+ extra) slots. Editable by the developer
      // themselves (this collection's normal update access, not
      // adminOnlyField) since picking projects is the whole point of the
      // slot system (owner, 2026-09-24: "they can choose which project").
      // Swapping which projects are picked never changes featuredUntil —
      // the package end date stays fixed regardless of swaps. The slot
      // pool is SHARED with featuredLandIds below (2026-09-25: "same plan/
      // slot system, but for land listings") — one project + one land
      // listing together use 2 of the same slots, not 1 of each kind's own
      // separate pool.
      name: 'featuredProjectIds',
      type: 'relationship',
      label: 'Featured Projects',
      relationTo: 'projects',
      hasMany: true,
      filterOptions: ({ id }): Where => (id ? { developer: { equals: id } } : { id: { equals: -1 } }),
      validate: (value, { siblingData }) => {
        const ids = Array.isArray(value) ? value : []
        const landIds = Array.isArray((siblingData as { featuredLandIds?: unknown[] })?.featuredLandIds) ? (siblingData as { featuredLandIds: unknown[] }).featuredLandIds : []
        const plan = (siblingData as { plan?: string })?.plan ?? 'free'
        const extras = (siblingData as { extra_featured_slots?: number })?.extra_featured_slots ?? 0
        const max = maxFeaturedProjects(plan, extras)
        if (max === 'custom' || ids.length + landIds.length <= max) return true
        return `You can feature at most ${max} project${max === 1 ? '' : 's'}/land listing${max === 1 ? '' : 's'} combined on your current plan — buy an extra slot or upgrade your plan to feature more.`
      },
      admin: {
        // Hidden from the default field UI — DeveloperPlanPanel (the
        // planPanel field right below) is the real interface for this,
        // with an On/Off toggle per project instead of a raw multi-select.
        // The field (and its validate/cap-enforcement above) still exists
        // and is still what gets saved.
        hidden: true,
        description: "Which of your own projects use your plan's featured slots. Projects left unpicked stay on Free even while you have an active paid plan — pick up to your plan's limit (base slots + any extra slots purchased), shared with your land listings below.",
      },
    },
    {
      // Land's equivalent of featuredProjectIds above — same shared slot
      // pool, same swap/no-extend behavior. Only land where THIS developer
      // is the seller (sellerType 'developer') can ever appear here —
      // construction-company- and builder-sold land have no plan to spend
      // a slot from (see the scope note on Lands.package).
      name: 'featuredLandIds',
      type: 'relationship',
      label: 'Featured Land Listings',
      relationTo: 'lands',
      hasMany: true,
      // `seller` is polymorphic (relationTo: ['developers', 'construction-
      // companies']) — must be queried as `seller.relationTo`/`seller.value`
      // dotted paths, not `seller: { equals }` directly (Payload's Postgres
      // adapter throws "Not supported" on that shape). Same fix as
      // sync-developer-plan.ts's featured-lands query.
      filterOptions: ({ id }): Where =>
        id
          ? { and: [{ 'seller.relationTo': { equals: 'developers' } }, { 'seller.value': { equals: id } }, { sellerType: { equals: 'developer' } }] }
          : { id: { equals: -1 } },
      validate: (value, { siblingData }) => {
        const ids = Array.isArray(value) ? value : []
        const projectIds = Array.isArray((siblingData as { featuredProjectIds?: unknown[] })?.featuredProjectIds) ? (siblingData as { featuredProjectIds: unknown[] }).featuredProjectIds : []
        const plan = (siblingData as { plan?: string })?.plan ?? 'free'
        const extras = (siblingData as { extra_featured_slots?: number })?.extra_featured_slots ?? 0
        const max = maxFeaturedProjects(plan, extras)
        if (max === 'custom' || ids.length + projectIds.length <= max) return true
        return `You can feature at most ${max} project${max === 1 ? '' : 's'}/land listing${max === 1 ? '' : 's'} combined on your current plan — buy an extra slot or upgrade your plan to feature more.`
      },
      admin: {
        hidden: true,
        description: "Which of your own land listings use your plan's featured slots (shared with featuredProjectIds above).",
      },
    },
    {
      // Set once, permanently, the first time ANY subscription activates
      // for this developer — founding or not (see Subscriptions.ts's
      // "becomingActive" hook). This is what makes "is this genuinely
      // their first-ever activation" knowable later, even after that
      // first subscription is canceled and its own status field no longer
      // says 'active' — without this, re-querying "have they ever had an
      // active subscription" would go blind the moment they cancel.
      name: 'first_subscribed_at',
      type: 'date',
      label: 'First Subscribed At',
      access: { update: adminOnlyField },
      admin: { readOnly: true, description: 'When this developer first activated any subscription, ever. Never changes after being set — used to decide founding-developer eligibility, not just a timestamp.' },
    },
    {
      // "Founding developer" launch discount (owner, 2026-09-25: first 10
      // developers, 40% off — see FOUNDING_DEVELOPER_CAP/_DISCOUNT in
      // packages.ts). System-granted only, at the moment a developer's
      // FIRST-EVER subscription is activated (Subscriptions.ts's
      // "becomingActive" hook) — never hand-set, and never revoked once
      // earned (applies to every subscription this developer activates
      // from then on, even through a later cancel/resubscribe).
      name: 'is_founding_developer',
      type: 'checkbox',
      label: 'Founding Developer (40% off, first 10)',
      defaultValue: false,
      access: { update: adminOnlyField },
      admin: {
        readOnly: true,
        description: 'Auto-granted the first time this developer activates a subscription, if fewer than 10 developers hold this already. Permanent once earned — applies to every future subscription payment, not just the first.',
      },
    },
    {
      // The actual interactive UI for choosing a plan and toggling which
      // projects use its slots — see DeveloperPlanPanel.tsx for the full
      // "buy a plan, pick your featured projects" flow and the exact
      // dashboard spec it matches (owner, 2026-09-24).
      // Labeled "Placements" (not "Plan") to match the public /pricing
      // page's own wording — "Choose your package and featured projects
      // from the Placements tab in your developer dashboard" (owner,
      // 2026-09-24).
      name: 'planPanel',
      type: 'ui',
      label: 'Placements',
      admin: { components: { Field: '@/components/payload/DeveloperPlanPanel#DeveloperPlanPanel' } },
    },
    // "Verified Developer" (internally "verified builder") — earned by confirming an email on the company's own domain (docs/verified-builder.md).
    // Written only by the server routes (src/app/(frontend)/api/developers/verify-domain/*) or by an admin.
    {
      name: 'domainVerifyPanel',
      type: 'ui',
      label: 'Verified Developer',
      admin: { components: { Field: '@/components/payload/DeveloperVerifyPanel#DeveloperVerifyPanel' } },
    },
    {
      name: 'domain_verified',
      type: 'checkbox',
      label: 'Verified Developer',
      defaultValue: false,
      access: { update: adminOnlyField },
      admin: { description: 'Shows the "Verified Developer" badge. Set automatically when the company confirms an email on its own website domain; an admin can also switch it on or off by hand.' },
    },
    { name: 'verified_domain', type: 'text', label: 'Verified domain', access: { update: adminOnlyField }, admin: { readOnly: true } },
    { name: 'verified_email', type: 'text', label: 'Verified email', access: { read: adminOnlyField, update: adminOnlyField }, admin: { readOnly: true } },
    { name: 'verified_at', type: 'date', label: 'Verified at', access: { update: adminOnlyField }, admin: { readOnly: true } },
    // Pending request (single-use link, 24 h). Only the sha-256 hash of the token is stored.
    { name: 'verify_token_hash', type: 'text', access: { read: adminOnlyField, update: adminOnlyField }, admin: { hidden: true } },
    { name: 'verify_expires', type: 'date', access: { read: adminOnlyField, update: adminOnlyField }, admin: { hidden: true } },
    { name: 'verify_pending_email', type: 'text', access: { read: adminOnlyField, update: adminOnlyField }, admin: { hidden: true } },
    { name: 'verify_last_sent', type: 'date', access: { read: adminOnlyField, update: adminOnlyField }, admin: { hidden: true } },
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

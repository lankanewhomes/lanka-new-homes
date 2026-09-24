import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, isAdmin, ownDeveloperAccess } from './access'
import { getPackage } from '@/lib/packages'
import { syncDeveloperPlanFromSubscription } from './hooks/sync-developer-plan'

// One row per developer's PLAN — not per project. Billing moved from
// per-project to per-developer 2026-09-24: a developer buys one plan for
// their whole company, which grants a number of featured slots (plus any
// extra slots bought here), and separately picks which of their own
// projects use those slots (Developers.featuredProjectIds — a developer's
// own choice, made in /cms, not tracked here). status tracks this
// subscription's lifecycle (active/past_due/canceled/incomplete/unpaid)
// rather than a single payment's pending/completed/failed/refunded.
//
// No live payment gateway is wired yet (see docs/todo.md — PayHere is the
// intended one, not Stripe) — `provider` defaults to 'manual' and an admin
// flips status -> 'active' by hand today, same manual-confirm step every
// other placement in Payments.ts already requires. `provider_subscription_id`
// / `provider_customer_id` are placeholders for whenever a real gateway is
// connected, so this schema doesn't need to change then.
export const SUBSCRIPTION_STATUS_OPTIONS = ['active', 'past_due', 'canceled', 'incomplete', 'unpaid'] as const
export const SUBSCRIPTION_PACKAGE_OPTIONS = ['featured', 'featured-plus', 'developer-pro', 'campaign'] as const

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'id',
    group: 'Business',
    defaultColumns: ['developer', 'package', 'extra_featured_slots', 'status', 'current_period_start', 'current_period_end'],
    // Readable table (developer name, status badges, formatted amounts)
    // instead of the raw document grid — same pattern as Analytics ->
    // AnalyticsDashboard. The real create/edit routes this links to are
    // untouched.
    components: {
      views: {
        list: {
          Component: '@/components/payload/SubscriptionsList#SubscriptionsList',
        },
      },
    },
  },
  access: {
    read: ownDeveloperAccess('developer'),
    create: ownDeveloperAccess('developer'),
    update: ownDeveloperAccess('developer'),
    delete: adminOnly,
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation !== 'create') return data

        // Price is never trusted from the client — always looked up
        // server-side from the single packages.ts source of truth. Extra
        // slots are clamped to what the tier actually allows (0 if the
        // tier doesn't sell them at all, or its own cap — e.g. Featured
        // Plus maxes out at 2) so a crafted request can't buy more than
        // the plan permits or slots a tier doesn't offer.
        const pkg = getPackage(data.package as string)
        const requestedExtras = typeof data.extra_featured_slots === 'number' ? data.extra_featured_slots : 0
        const extras =
          pkg.extraFeaturedSlotPrice == null
            ? 0
            : pkg.extraFeaturedSlotCap != null
              ? Math.min(Math.max(0, requestedExtras), pkg.extraFeaturedSlotCap)
              : Math.max(0, requestedExtras)
        const amount = pkg.customPricing ? pkg.price : pkg.price + extras * (pkg.extraFeaturedSlotPrice ?? 0)
        return {
          ...data,
          status: 'incomplete',
          extra_featured_slots: extras,
          amount,
          currency: pkg.currency,
          provider: data.provider || 'manual',
        }
      },
      // Confirming a subscription (status -> active, e.g. an admin
      // approving payment) auto-fills the billing window if it isn't set
      // yet — same "confirming activates automatically" idea as
      // hooks/activate-placement.ts, done here in beforeChange (not
      // afterChange) so it can't recurse into this same hook.
      ({ data, originalDoc }) => {
        const becomingActive = data.status === 'active' && originalDoc?.status !== 'active'
        if (!becomingActive) return data
        const start = data.current_period_start ?? originalDoc?.current_period_start ?? new Date().toISOString()
        const end = data.current_period_end ?? originalDoc?.current_period_end
        const periodEnd = end ?? new Date(new Date(start).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        return { ...data, current_period_start: start, current_period_end: periodEnd }
      },
    ],
    afterChange: [syncDeveloperPlanFromSubscription],
  },
  fields: [
    {
      name: 'developer',
      type: 'relationship',
      relationTo: 'developers',
      required: true,
      index: true,
      access: { update: adminOnlyField },
      // Without this, the relationship picker lists every developer on the
      // platform — a developer-role account creating their own subscription
      // (e.g. via the "+ Create" button on the Subscriptions list) would see
      // every other company's name. Admin still sees everyone.
      filterOptions: async ({ req }) => {
        if (isAdmin(req)) return true
        const ownedIds = await getOwnedDeveloperIds(req)
        return { id: { in: ownedIds.length ? ownedIds : [-1] } }
      },
    },
    { name: 'package', type: 'select', label: 'Plan', options: [...SUBSCRIPTION_PACKAGE_OPTIONS], required: true, access: { update: adminOnlyField } },
    {
      name: 'extra_featured_slots',
      type: 'number',
      label: 'Extra Featured Slots',
      defaultValue: 0,
      access: { update: adminOnlyField },
      admin: {
        description: "Additional featured-project slots beyond the plan's included amount, at that plan's per-extra-slot price (see src/lib/packages.ts) — clamped server-side to whatever the plan actually allows.",
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [...SUBSCRIPTION_STATUS_OPTIONS],
      defaultValue: 'incomplete',
      required: true,
      access: { update: adminOnlyField },
      admin: { description: 'Set to "active" once payment is confirmed — activates the plan automatically (see hooks/sync-developer-plan.ts). No live gateway yet, so this is a manual step, same as Payments today.' },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Snapshot of the price at signup (plan + any extra slots), from src/lib/packages.ts — for every fixed-price tier this is set automatically and shouldn't be hand-edited. Exception: `campaign` has no fixed price (negotiated per deal) — an admin sets the real agreed amount here after creating the subscription.",
      },
    },
    { name: 'currency', type: 'select', options: ['LKR', 'USD', 'CAD'], defaultValue: 'LKR', required: true, access: { update: adminOnlyField } },
    { name: 'current_period_start', type: 'date', label: 'Start Date', access: { update: adminOnlyField } },
    { name: 'current_period_end', type: 'date', label: 'Renewal Date', access: { update: adminOnlyField } },
    {
      name: 'cancel_at_period_end',
      type: 'checkbox',
      label: 'Cancel at period end',
      defaultValue: false,
      admin: { description: 'A developer can check this to cancel — the plan (and every featured project it grants) stays active until the renewal date, then everything reverts to Free.' },
    },
    { name: 'provider', type: 'select', options: ['manual', 'payhere', 'stripe'], defaultValue: 'manual', access: { update: adminOnlyField } },
    { name: 'provider_subscription_id', type: 'text', label: 'Provider Subscription ID', access: { update: adminOnlyField }, admin: { description: 'Placeholder for a future payment gateway (e.g. PayHere) subscription reference.' } },
    { name: 'provider_customer_id', type: 'text', label: 'Provider Customer ID', access: { update: adminOnlyField } },
  ],
}

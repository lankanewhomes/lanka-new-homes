import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, getOwnedDeveloperIds, isAdmin, ownDeveloperAccess } from './access'
import { BILLING_INTERVAL_MULTIPLIERS, FOUNDING_DEVELOPER_CAP, FOUNDING_DEVELOPER_DISCOUNT, getPackage, type BillingInterval } from '@/lib/packages'
import { syncDeveloperPlanFromSubscription } from './hooks/sync-developer-plan'

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string | number }).id
  return value as string | number | undefined
}

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
        // the plan permits or slots a tier doesn't offer. The billing
        // interval multiplier is applied here (real cycles, 2026-09-25 —
        // see BILLING_INTERVAL_MULTIPLIERS in packages.ts); the
        // founding-developer discount is NOT applied yet at create time —
        // see the "becomingActive" hook below for why.
        const pkg = getPackage(data.package as string)
        const requestedExtras = typeof data.extra_featured_slots === 'number' ? data.extra_featured_slots : 0
        const extras =
          pkg.extraFeaturedSlotPrice == null
            ? 0
            : pkg.extraFeaturedSlotCap != null
              ? Math.min(Math.max(0, requestedExtras), pkg.extraFeaturedSlotCap)
              : Math.max(0, requestedExtras)
        const interval = (['monthly', 'quarterly', 'annual'].includes(data.billing_interval as string) ? data.billing_interval : 'monthly') as BillingInterval
        const baseAmount = pkg.customPricing ? pkg.price : pkg.price + extras * (pkg.extraFeaturedSlotPrice ?? 0)
        const amount = pkg.customPricing ? baseAmount : baseAmount * BILLING_INTERVAL_MULTIPLIERS[interval]
        return {
          ...data,
          status: 'incomplete',
          extra_featured_slots: extras,
          billing_interval: interval,
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
      //
      // "Founding developer" discount (owner, 2026-09-25: first 10
      // developers, 40% off — packages.ts's FOUNDING_DEVELOPER_CAP/
      // _DISCOUNT) is decided HERE, at the moment of activation, not at
      // creation — an incomplete/abandoned request that never gets
      // confirmed should never cost a developer their shot at a slot.
      // `Developers.first_subscribed_at` (set below, permanently, the
      // first time ANY subscription activates for them — founding or not)
      // is what makes "is this genuinely their first-ever activation"
      // knowable later even after this subscription is canceled and its
      // own status field no longer says 'active'.
      async ({ data, originalDoc, req }) => {
        const becomingActive = data.status === 'active' && originalDoc?.status !== 'active'
        if (!becomingActive) return data
        const start = data.current_period_start ?? originalDoc?.current_period_start ?? new Date().toISOString()
        const end = data.current_period_end ?? originalDoc?.current_period_end
        const periodEnd = end ?? new Date(new Date(start).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

        const developerId = relatedId(data.developer ?? originalDoc?.developer)
        const pkg = getPackage((data.package ?? originalDoc?.package) as string)
        let amount = (data.amount ?? originalDoc?.amount) as number | undefined
        let foundingDiscountApplied = Boolean(originalDoc?.founding_discount_applied)

        if (developerId && !pkg.customPricing && !foundingDiscountApplied) {
          const developer = await req.payload.findByID({ collection: 'developers', id: developerId, depth: 0, overrideAccess: true, req }).catch(() => null)
          if (developer) {
            const isFirstActivation = !developer.first_subscribed_at
            let grantFounding = Boolean(developer.is_founding_developer)
            if (!grantFounding && isFirstActivation) {
              const foundingCount = await req.payload.count({ collection: 'developers', where: { is_founding_developer: { equals: true } }, overrideAccess: true, req })
              grantFounding = foundingCount.totalDocs < FOUNDING_DEVELOPER_CAP
            }
            if (grantFounding) {
              foundingDiscountApplied = true
              if (typeof amount === 'number') amount = Math.round(amount * (1 - FOUNDING_DEVELOPER_DISCOUNT))
            }
            // first_subscribed_at is set on ANY first activation, founding
            // or not — once set, this developer can never become
            // newly-eligible for founding status again (matches "first 10
            // developers," not "first 10 activations").
            if (isFirstActivation || grantFounding) {
              await req.payload.update({
                collection: 'developers',
                id: developerId,
                data: {
                  first_subscribed_at: developer.first_subscribed_at ?? start,
                  ...(grantFounding ? { is_founding_developer: true } : {}),
                },
                overrideAccess: true,
                req,
                depth: 0,
              })
            }
          }
        }

        return { ...data, current_period_start: start, current_period_end: periodEnd, founding_discount_applied: foundingDiscountApplied, amount }
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
      // Real billing cycles (owner, 2026-09-25) — see
      // BILLING_INTERVAL_MULTIPLIERS in packages.ts. Quarterly has no
      // separate discount; annual is exactly the "2 months free" already
      // promised on /pricing. Not offered for Campaign (customPricing —
      // its amount is negotiated, not computed).
      name: 'billing_interval',
      type: 'select',
      label: 'Billing Interval',
      options: ['monthly', 'quarterly', 'annual'],
      defaultValue: 'monthly',
      access: { update: adminOnlyField },
      admin: { description: 'How often this plan bills. Quarterly = 3x the monthly price; Annual = 10x (2 months free). Set from the developer\'s own request (Placements tab) or by an admin.' },
    },
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
      // Audit trail only — the real decision logic lives in the
      // "becomingActive" beforeChange hook above (packages.ts's
      // FOUNDING_DEVELOPER_CAP/_DISCOUNT); this just records what happened
      // to THIS subscription's amount, so it's visible after the fact
      // without recomputing anything.
      name: 'founding_discount_applied',
      type: 'checkbox',
      label: 'Founding Developer Discount Applied',
      defaultValue: false,
      access: { update: adminOnlyField },
      admin: { readOnly: true, description: "Whether this subscription's amount includes the 40% founding-developer discount (packages.ts). Decided once, at activation — never recalculated afterward." },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      access: { update: adminOnlyField },
      admin: {
        description:
          "Snapshot of the price (plan + any extra slots, x the billing interval, minus 40% if founding_discount_applied), from src/lib/packages.ts — for every fixed-price tier this is set automatically and shouldn't be hand-edited. Exception: `campaign` has no fixed price (negotiated per deal) — an admin sets the real agreed amount here after creating the subscription.",
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

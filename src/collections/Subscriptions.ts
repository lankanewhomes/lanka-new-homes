import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField, ownDeveloperAccess } from './access'
import { getPackage } from '@/lib/packages'
import { syncProjectPackageFromSubscription } from './hooks/sync-subscription-package'

// One row per *paid* (Featured/Premium) package on one project — a Free
// project has no row here at all. This is the recurring-package sibling to
// Payments (which logs one-off placement purchases); status here tracks a
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
export const SUBSCRIPTION_PACKAGE_OPTIONS = ['featured', 'premium'] as const

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    useAsTitle: 'id',
    group: 'Business',
    defaultColumns: ['project', 'developer', 'package', 'status', 'current_period_start', 'current_period_end'],
    // Readable table (developer/project names, status badges, formatted
    // amounts) instead of the raw document grid — same pattern as
    // Analytics -> AnalyticsDashboard. The real create/edit routes this
    // links to are untouched.
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
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data

        // Defense in depth: ownDeveloperAccess above already confirmed
        // `developer` is one the requester owns (or the requester is
        // admin) — this additionally confirms the *project* actually
        // belongs to that same developer, so a developer can't attach a
        // subscription to a project they don't own by passing a developer
        // id they do own alongside it.
        const projectId = typeof data.project === 'object' && data.project ? data.project.id : data.project
        if (projectId) {
          const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true, req })
          const projectDeveloperId = typeof project?.developer === 'object' && project?.developer ? project.developer.id : project?.developer
          const submittedDeveloperId = typeof data.developer === 'object' && data.developer ? data.developer.id : data.developer
          if (!project || String(projectDeveloperId) !== String(submittedDeveloperId)) {
            throw new Error('This project does not belong to the specified developer.')
          }
        }

        // Price is never trusted from the client — always looked up
        // server-side from the single packages.ts source of truth.
        const pkg = getPackage(data.package as string)
        return {
          ...data,
          status: 'incomplete',
          amount: pkg.price,
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
    afterChange: [syncProjectPackageFromSubscription],
  },
  fields: [
    { name: 'project', type: 'relationship', relationTo: 'projects', required: true, index: true },
    { name: 'developer', type: 'relationship', relationTo: 'developers', required: true, index: true, access: { update: adminOnlyField } },
    { name: 'package', type: 'select', options: [...SUBSCRIPTION_PACKAGE_OPTIONS], required: true, access: { update: adminOnlyField } },
    {
      name: 'status',
      type: 'select',
      options: [...SUBSCRIPTION_STATUS_OPTIONS],
      defaultValue: 'incomplete',
      required: true,
      access: { update: adminOnlyField },
      admin: { description: 'Set to "active" once payment is confirmed — activates the project automatically (see hooks/sync-subscription-package.ts). No live gateway yet, so this is a manual step, same as Payments today.' },
    },
    { name: 'amount', type: 'number', required: true, access: { update: adminOnlyField }, admin: { readOnly: true, description: 'Snapshot of the price at signup, from src/lib/packages.ts — never edited by hand.' } },
    { name: 'currency', type: 'select', options: ['LKR', 'USD', 'CAD'], defaultValue: 'LKR', required: true, access: { update: adminOnlyField } },
    { name: 'current_period_start', type: 'date', label: 'Start Date', access: { update: adminOnlyField } },
    { name: 'current_period_end', type: 'date', label: 'Renewal Date', access: { update: adminOnlyField } },
    { name: 'cancel_at_period_end', type: 'checkbox', label: 'Cancel at period end', defaultValue: false, admin: { description: 'A developer can check this to cancel — stays active (and featured) until the renewal date, then reverts to Free.' } },
    { name: 'provider', type: 'select', options: ['manual', 'payhere', 'stripe'], defaultValue: 'manual', access: { update: adminOnlyField } },
    { name: 'provider_subscription_id', type: 'text', label: 'Provider Subscription ID', access: { update: adminOnlyField }, admin: { description: 'Placeholder for a future payment gateway (e.g. PayHere) subscription reference.' } },
    { name: 'provider_customer_id', type: 'text', label: 'Provider Customer ID', access: { update: adminOnlyField } },
  ],
}

import type { CollectionConfig } from 'payload'
import { adminOnly, adminOnlyField } from './access'

// Captures interest in a paid plan before the payment gateway is live
// (owner, 2026-09-24: "the paid columns have no action, so interested
// builders can't do anything... this way you collect leads before
// launch"). Public "Get early access" button on /pricing submits here
// instead of the plan being a dead end — same "guests can submit without
// an account" pattern as Leads.ts.
export const PlanWaitlist: CollectionConfig = {
  slug: 'plan-waitlist',
  admin: {
    useAsTitle: 'email',
    group: 'Business',
    defaultColumns: ['name', 'email', 'company', 'interested_plan', 'status', 'createdAt'],
  },
  access: {
    create: () => true,
    read: adminOnly,
    update: adminOnly,
    delete: adminOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'company', type: 'text' },
    {
      name: 'interested_plan',
      type: 'select',
      label: 'Interested Plan',
      options: ['featured', 'featured-plus', 'developer-pro', 'campaign'],
      admin: { description: 'Which plan\'s "Get early access" button they clicked.' },
    },
    { name: 'message', type: 'textarea' },
    {
      name: 'status',
      type: 'select',
      options: ['new', 'contacted', 'converted', 'not_interested'],
      defaultValue: 'new',
      access: { update: adminOnlyField },
    },
  ],
}

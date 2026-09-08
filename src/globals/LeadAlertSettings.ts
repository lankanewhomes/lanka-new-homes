import type { GlobalConfig } from 'payload'
import { adminOnly, hiddenUnlessAdmin } from '../collections/access'

// Admin switch for where lead alerts go (src/lib/lead-alerts.ts).
//
// Live mode: the project's developer is emailed / WhatsApped. Test mode:
// every alert is redirected to the test inbox and no WhatsApp is sent —
// flip it on before QA-ing the inquiry form on the live site, off after.
// Local dev and Vercel preview deployments are always in test routing
// regardless of this switch, and a lead whose email is an admin account's
// or a known test domain (resend.dev, example.com, …) is routed to the
// test inbox even in live mode — see resolveLeadAlertRouting().
export const LeadAlertSettings: GlobalConfig = {
  slug: 'lead-alert-settings',
  label: 'Lead alert settings',
  access: { read: adminOnly, update: adminOnly },
  admin: { group: 'Settings', hidden: hiddenUnlessAdmin },
  fields: [
    {
      name: 'mode',
      type: 'select',
      required: true,
      defaultValue: 'live',
      options: [
        { label: 'Live — developers get their lead alerts', value: 'live' },
        { label: 'Test — every alert goes to the test inbox instead', value: 'test' },
      ],
      admin: {
        description:
          'Switch to Test before submitting trial inquiries on the live site, and back to Live when done. A red banner on the dashboard shows while Test is on. Local dev and preview deployments always use test routing.',
      },
    },
    {
      name: 'testInbox',
      type: 'email',
      label: 'Test inbox',
      admin: { description: 'Where redirected alerts go. Leave blank for LEAD_ALERTS_TEST_INBOX (default delivered@resend.dev, which accepts and discards mail).' },
    },
  ],
}

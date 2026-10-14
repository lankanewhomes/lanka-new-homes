/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { Payload, PayloadRequest } from 'payload'
import { renderPlainReplyEmail } from './outreach-templates'
import { sendMail } from './mailer'
import { DEFAULT_TEST_INBOX, isProductionDeployment } from './lead-alerts'

// Team members (owner decision, 2026-10-14). A company's main login (verified with the company email, e.g. info@primelands.lk)
// has full control. It can add a team member by typing an email (e.g. info@primeresidences.lk) and ticking the listings that
// person handles. The person must confirm that email address (normal account confirmation) before anything is linked, and then
// can edit and delete only those listings and sees only the enquiries about them. Enquiries about those listings are emailed to
// the company AND to the team member (see lead-alerts.ts).

const SITE = (process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.lankanewhomes.com').replace(/\/$/, '')

export const normEmail = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

/**
 * Link every open invite for this (confirmed) account to it. Called after a login, which is only possible once the email has
 * been confirmed, and when an owner invites an address that already has a confirmed account. Returns how many rows were linked.
 */
export async function linkTeamInvites(payload: Payload, user: { id: number | string; email?: string | null; role?: string | null; _verified?: boolean | null }, req?: PayloadRequest): Promise<number> {
  const email = normEmail(user.email)
  if (!email || !user._verified) return 0
  const open = await payload.find({
    collection: 'team-members' as never,
    where: { and: [{ email: { equals: email } }, { user: { exists: false } }] } as never,
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  })
  if (open.docs.length === 0) return 0
  for (const row of open.docs as any[]) {
    await payload.update({ collection: 'team-members' as never, id: row.id, data: { user: user.id, status: 'active' } as never, overrideAccess: true, req })
  }
  // A team member works in the same CMS as a developer. Buyers are moved to the developer role; admins are left alone.
  if (user.role === 'buyer') {
    await payload.update({ collection: 'users', id: user.id, data: { role: 'developer' } as never, overrideAccess: true, req })
  }
  return open.docs.length
}

/** The email an owner's invite sends. Outside production it goes to the test inbox instead, like every other site email. */
export async function sendTeamInviteEmail(opts: { to: string; companyName: string; listingNames: string[]; accountExists: boolean }) {
  const prod = isProductionDeployment()
  const lines = opts.listingNames.length ? `\n\nListings you can manage:\n${opts.listingNames.map((n) => `- ${n}`).join('\n')}` : ''
  const action = opts.accountExists
    ? 'Sign in with this email address and the listings appear in your dashboard.'
    : 'Create a free account with this email address (you will be asked to confirm it), and the listings appear in your dashboard.'
  const { html, text } = renderPlainReplyEmail({
    body: `Hi,\n\n${opts.companyName} added you as a team member on LankaNewHomes.${lines}\n\nYou can edit these listings and see the buyer enquiries about them. ${action}`,
    signoff: 'Thank you,',
    signName: 'The LankaNewHomes team',
    button: { href: `${SITE}/developers/${opts.accountExists ? 'login' : 'register'}`, text: opts.accountExists ? 'Sign in' : 'Create my account' },
  })
  await sendMail({
    to: prod ? opts.to : DEFAULT_TEST_INBOX,
    from: 'LankaNewHomes <no-reply@lankanewhomes.com>',
    replyTo: 'support@lankanewhomes.com',
    subject: `${prod ? '' : `[TEST — not sent to ${opts.to}] `}${opts.companyName} added you to their listings on LankaNewHomes`,
    html,
    text,
  })
}

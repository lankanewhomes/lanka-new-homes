/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionAfterLoginHook } from 'payload'
import { checkEmailAgainstWebsite, emailDomain } from '@/lib/developer-domain-verification'

// Automatic "Verified Developer" (owner, 2026-10-05). A developer account can only log in after confirming its email
// (Users auth.verify), so by the time this runs the account owner has proven they control that mailbox. If that email
// sits on the linked company's own website domain (or an admin-approved extra domain), the company is verified without
// the separate confirmation-link step. Idempotent: it runs on every developer login and does nothing once verified.
export const autoVerifyDeveloperOnLogin: CollectionAfterLoginHook = async ({ user, req }) => {
  try {
    const account = user as any
    if (account?.role !== 'developer' || !account._verified || !account.email) return user
    const found = await req.payload.find({ collection: 'developers', where: { user: { equals: account.id } }, limit: 1, depth: 0, overrideAccess: true, req })
    const developer = found.docs[0] as any
    if (!developer || developer.domain_verified) return user
    const email = String(account.email).trim().toLowerCase()
    if (!checkEmailAgainstWebsite(email, developer.website, developer.extra_email_domains).ok) return user
    await req.payload.update({
      collection: 'developers',
      id: developer.id,
      data: { domain_verified: true, verified_email: email, verified_domain: emailDomain(email), verified_at: new Date().toISOString() } as any,
      overrideAccess: true,
      req,
    })
  } catch (error) {
    req.payload.logger.error(`Auto-verify developer failed: ${error instanceof Error ? error.message : error}`)
  }
  return user
}

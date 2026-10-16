/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionAfterChangeHook } from 'payload'
import { sendMail } from '@/lib/mailer'
import { isProductionDeployment } from '@/lib/lead-alerts'
import { developerVerifiedSubject, renderDeveloperVerifiedHTML, renderDeveloperVerifiedText } from '@/lib/developer-verified-email'

const TO = 'developers@lankanewhomes.com'
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Owner, 2026-10-15: when a developer is verified, (1) the developer gets the thank-you / Verified Developer email, copied to
// developers@lankanewhomes.com, and (2) when the company verified itself (company-domain email confirmed, or the automatic check
// at login) developers@ also gets a heads-up with a review link and how to remove the badge. Once, when the badge switches on;
// production only.
export const notifyDeveloperVerified: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  try {
    if (operation !== 'update' || !doc?.domain_verified || previousDoc?.domain_verified) return doc
    if (!isProductionDeployment()) {
      req.payload.logger.info(`Verified Developer emails skipped outside production (${doc.name})`)
      return doc
    }
    const selfVerified = (req.user as any)?.role !== 'admin'
    // 1. Thank-you and confirmation to the developer (every path, including an admin approval), copied to developers@.
    try {
      let to: string | null = doc.verified_email || doc.contact_email || null
      if (!to && doc.user) {
        const u = await req.payload.findByID({ collection: 'users', id: typeof doc.user === 'object' ? doc.user.id : doc.user, depth: 0, overrideAccess: true, req }).catch(() => null)
        to = (u as any)?.email ?? null
      }
      if (to) {
        const input = { companyName: doc.name, verifiedEmail: doc.verified_email || null, profileUrl: `https://www.lankanewhomes.com/developers/${doc.slug}`, loginUrl: 'https://www.lankanewhomes.com/developers/login' }
        await sendMail({ to, from: TO, replyTo: TO, bcc: TO, subject: developerVerifiedSubject(doc.name), html: renderDeveloperVerifiedHTML(input), text: renderDeveloperVerifiedText(input) })
      }
    } catch (error) {
      req.payload.logger.error(`Verified Developer thank-you failed: ${error instanceof Error ? error.message : error}`)
    }
    // 2. Heads-up to the owner with a review link, only when the company verified itself (an admin already knows).
    if (!selfVerified) return doc
    const url = `https://www.lankanewhomes.com/dashboard/developers/${doc.id}`
    await sendMail({
      to: TO,
      from: TO,
      replyTo: TO,
      subject: `Verified Developer: ${doc.name}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#2b2b29;line-height:1.5;max-width:560px">
<p><strong>${esc(doc.name)}</strong> just became a Verified Developer.</p>
<p>Confirmed with: <strong>${esc(doc.verified_email || '(admin approval)')}</strong>${doc.verified_domain ? ` on <strong>${esc(doc.verified_domain)}</strong>` : ''}<br/>Company website: ${esc(doc.website || 'not set')}</p>
<p><a href="${url}" style="display:inline-block;background:#2b2b29;color:#fff;padding:10px 16px;text-decoration:none">Review in the dashboard</a></p>
<p style="color:#6b6a66;font-size:13px">If it looks wrong, open the developer in the dashboard, go to the Verification tab and untick Verified Developer. You can also use the Remove verified button on the Developers list.</p>
</div>`,
      text: `${doc.name} just became a Verified Developer.\nConfirmed with: ${doc.verified_email || '(admin approval)'}${doc.verified_domain ? ` on ${doc.verified_domain}` : ''}\nReview: ${url}\nTo remove it: open the developer, Verification tab, untick Verified Developer.`,
    })
  } catch (error) {
    req.payload.logger.error(`Verified Developer notice failed: ${error instanceof Error ? error.message : error}`)
  }
  return doc
}

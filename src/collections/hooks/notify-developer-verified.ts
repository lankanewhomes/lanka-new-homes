/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionAfterChangeHook } from 'payload'
import { sendMail } from '@/lib/mailer'
import { isProductionDeployment } from '@/lib/lead-alerts'

const TO = 'developers@lankanewhomes.com'
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Owner, 2026-10-15: "when the developers get verified I need an email sent to developers@lankanewhomes.com so I can confirm it."
// Fires once when a company's Verified Developer badge switches on by itself (company-domain email confirmed, or the automatic
// check at login). It does not fire when an admin ticks or approves it in the dashboard, and it only sends from production.
// The email says how to review it and how to take the badge off.
export const notifyDeveloperVerified: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  try {
    if (operation !== 'update' || !doc?.domain_verified || previousDoc?.domain_verified) return doc
    if ((req.user as any)?.role === 'admin') return doc
    if (!isProductionDeployment()) {
      req.payload.logger.info(`Verified Developer notice skipped outside production (${doc.name})`)
      return doc
    }
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

// "You are now a Verified Developer" thank-you email to the developer (owner, 2026-10-15: sent when a developer is verified, with the
// badge shown in the email). Same look as the other LankaNewHomes emails. Sent from developers@lankanewhomes.com.
const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export type DeveloperVerifiedEmailInput = {
  companyName: string
  /** The company-domain address that proved ownership (shown in the text), when there is one. */
  verifiedEmail?: string | null
  profileUrl: string
  loginUrl: string
}

export function developerVerifiedSubject(companyName: string): string {
  return `${companyName} is now a Verified Developer on LankaNewHomes`
}

export function renderDeveloperVerifiedHTML(i: DeveloperVerifiedEmailInput): string {
  const how = i.verifiedEmail
    ? `We have confirmed your company through <strong>${esc(i.verifiedEmail)}</strong>, an email address on your own website, and your profile now carries the <strong>Verified Developer</strong> badge.`
    : `We have confirmed your company, and your profile now carries the <strong>Verified Developer</strong> badge.`
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verified Developer</title></head>
<body style="margin:0;background:#faf7f2;font-family:Arial,Helvetica,sans-serif;color:#2b2b29;">
<div style="display:none;max-height:0;overflow:hidden;">Your company now shows the Verified Developer badge on LankaNewHomes.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e4e2db;">
  <tr><td style="padding:22px 28px;border-bottom:1px solid #e4e2db;font-size:20px;font-weight:700;letter-spacing:-0.02em;line-height:1.05;">Lanka<br>NewHomes</td></tr>
  <tr><td style="padding:30px 28px 8px;">
    <span style="display:inline-block;background:#ecfeff;border:1px solid #67e8f9;color:#0e7490;font-size:13px;font-weight:700;padding:6px 12px;border-radius:3px;">&#10003;&nbsp; Verified Developer</span>
    <h1 style="margin:16px 0 12px;font-size:26px;font-weight:400;line-height:1.2;">${esc(i.companyName)} is now a Verified Developer.</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Hello ${esc(i.companyName)} team,</p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">Thank you for joining LankaNewHomes. ${how}</p>
  </td></tr>
  <tr><td style="padding:0 28px 8px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;border:1px solid #e4e2db;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;">
        <strong style="font-size:15px;">Where buyers will see the badge</strong><br>
        &bull; On your company page<br>
        &bull; On the contact card of each of your listings<br>
        &bull; In the hero of your project and floor-plan pages
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:20px 28px 8px;">
    <p style="margin:0 0 10px;font-size:15px;font-weight:700;">Three things that help buyers say yes</p>
    <ol style="margin:0 0 16px;padding-left:20px;font-size:15px;line-height:1.7;">
      <li><strong>Check your listings.</strong> Photos, floor plans, prices and the payment plan.</li>
      <li><strong>Add your WhatsApp number.</strong> Buyers can message you in one tap, and we show you which enquiries came from WhatsApp.</li>
      <li><strong>Answer enquiries quickly.</strong> A reply within the hour earns the &ldquo;Responds within 1 hour&rdquo; badge.</li>
    </ol>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6a66;">Your badge stays on as long as your company website stays the same. If you change your website address, just confirm an email on the new one and it comes straight back.</p>
  </td></tr>
  <tr><td align="center" style="padding:0 28px 26px;">
    <a href="${esc(i.profileUrl)}" style="display:inline-block;background:#2b2b29;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:13px 22px;">See your company page</a>
    <p style="margin:12px 0 0;font-size:13px;"><a href="${esc(i.loginUrl)}" style="color:#2b2b29;">Log in to your dashboard</a></p>
  </td></tr>
  <tr><td style="padding:0 28px 26px;">
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;">Questions, or something to change on your page? Just reply to this email and a person will answer.</p>
    <p style="margin:14px 0 0;font-size:15px;line-height:1.6;">Warm regards,<br><strong>The LankaNewHomes team</strong><br><span style="color:#6b6a66;font-size:13px;">developers@lankanewhomes.com</span></p>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid #e4e2db;font-size:12px;line-height:1.5;color:#6b6a66;">You are receiving this because your company registered on LankaNewHomes. Sri Lanka's new homes marketplace: new apartments, houses and land, with prices, floor plans and developer details in one place.</td></tr>
</table></td></tr></table></body></html>`
}

export function renderDeveloperVerifiedText(i: DeveloperVerifiedEmailInput): string {
  return `VERIFIED DEVELOPER

Hello ${i.companyName} team,

Thank you for joining LankaNewHomes. ${i.verifiedEmail ? `We have confirmed your company through ${i.verifiedEmail}, an email address on your own website, and your` : 'We have confirmed your company, and your'} profile now carries the Verified Developer badge.

Where buyers will see the badge
- On your company page
- On the contact card of each of your listings
- In the hero of your project and floor-plan pages

Three things that help buyers say yes
1. Check your listings: photos, floor plans, prices and the payment plan.
2. Add your WhatsApp number: buyers can message you in one tap.
3. Answer enquiries quickly: a reply within the hour earns the "Responds within 1 hour" badge.

Your badge stays on as long as your company website stays the same. If you change your website address, confirm an email on the new one and it comes straight back.

See your company page: ${i.profileUrl}
Log in to your dashboard: ${i.loginUrl}

Questions, or something to change on your page? Just reply to this email and a person will answer.

Warm regards,
The LankaNewHomes team
developers@lankanewhomes.com
`
}

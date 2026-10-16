// "You are now a Verified Developer" thank-you email to the developer (owner, 2026-10-15: sent when a developer is verified, with the
// badge shown in the email). Same look as the other LankaNewHomes emails. Sent from developers@lankanewhomes.com.
import { emailButton, emailHero, emailNumbered, emailPanel, emailPara, emailShell, emailSignoff, esc, verifiedPill } from './email-layout'

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
  const body = [
    `  <tr><td style="padding:30px 32px 0;">${verifiedPill()}</td></tr>`,
    emailHero(`${esc(i.companyName)} is now a Verified Developer.`),
    emailPara(`Hello ${esc(i.companyName)} team,`),
    emailPara(`Thank you for joining LankaNewHomes. ${how}`),
    emailPanel({ heading: 'Where buyers will see the badge', bodyHtml: '&bull; On your company page<br>&bull; On the contact card of each of your listings<br>&bull; In the hero of your project and floor-plan pages' }),
    emailPara('<strong style="font-size:16px;">Three things that help buyers say yes</strong>'),
    emailNumbered([
      { title: 'Check your listings', body: 'Photos, floor plans, prices and the payment plan.' },
      { title: 'Add your WhatsApp number', body: 'Buyers can message you in one tap, and we show you which enquiries came from WhatsApp.' },
      { title: 'Answer enquiries quickly', body: 'A reply within the hour earns the &ldquo;Responds within 1 hour&rdquo; badge.' },
    ]),
    emailPara('Your badge stays on as long as your company website stays the same. If you change your website address, just confirm an email on the new one and it comes straight back.', true),
    emailButton('See your company page', i.profileUrl, { label: 'Log in to your dashboard', href: i.loginUrl }),
    emailSignoff('<p style="margin:0;">Questions, or something to change on your page? Just reply to this email and a person will answer.</p>'),
  ].join('\n')
  return emailShell({ preheader: 'Your company now shows the Verified Developer badge on LankaNewHomes.', title: 'Verified Developer', body })
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

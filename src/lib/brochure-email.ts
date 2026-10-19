import { emailButton, emailHero, emailPara, emailShell, esc } from './email-layout'

// "Here's your brochure": sent to a buyer who asked for a brochure (from /api/leads). Restyled 2026-10-18 to the shared email layout
// (src/lib/email-layout.ts), same look as the developer emails.
export function renderBrochureEmailHTML({ projectName, brochureUrl }: { projectName: string; brochureUrl: string }): string {
  const name = esc(projectName)
  const body = [
    emailHero(`Your ${name} brochure.`, 'Thank you for your interest.'),
    emailPara(`Thanks for asking about <strong>${name}</strong>. Download the brochure with the button below.`),
    emailButton('Download the brochure', brochureUrl),
    `  <tr><td align="center" style="padding:6px 32px 24px;font-size:12px;line-height:1.5;color:#6b6a66;word-break:break-all;">Or paste this link into your browser:<br><a href="${esc(brochureUrl)}" style="color:#6b6a66;">${esc(brochureUrl)}</a></td></tr>`,
  ].join('\n')
  return emailShell({
    preheader: `Your ${projectName} brochure from LankaNewHomes.`,
    title: `Your ${projectName} brochure`,
    body,
    footerNote: 'You are receiving this because you asked for a brochure on LankaNewHomes. This inbox is not monitored; for help write to <a href="mailto:support@lankanewhomes.com" style="color:#ffffff;">support@lankanewhomes.com</a>.',
  })
}

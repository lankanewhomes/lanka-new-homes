import { emailButton, emailHero, emailPanel, emailPara, emailShell, emailSignoff, esc } from './email-layout'

// "Missing details" email for a developer with SEVERAL projects (owner, 2026-10-16: three or more projects = ONE combined email; one or
// two = a separate email each). Approved layout: a card per project (numbered tile, linked name, short bullets split into two columns),
// then one Verified Developer panel. Keep each project to a few plain bullets so it stays easy to read. Never sent automatically: the
// owner approves every send.

export type MissingInfoProject = { name: string; slug: string; items: string[] }

const INK = '#1c1c20'
const OR = '#f47b36'
const LINE = '#e4e2db'
const SITE = 'https://www.lankanewhomes.com'

const bullet = (t: string) => `<div style="padding:3px 0;font-size:14px;line-height:1.45;color:#2b2b29;"><span style="color:${OR};font-weight:700;">&bull;</span>&nbsp; ${esc(t)}</div>`

function card(p: MissingInfoProject, i: number): string {
  const half = Math.ceil(p.items.length / 2)
  return `<tr><td style="padding:0 0 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};"><tr>
<td width="46" valign="top" style="background:${INK};color:#fff;text-align:center;font-size:17px;font-weight:700;padding:16px 0;">${i + 1}</td>
<td style="padding:14px 18px;"><a href="${SITE}/projects/${esc(p.slug)}" style="font-size:16px;font-weight:700;color:${INK};text-decoration:none;">${esc(p.name)}</a>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;border-top:1px solid ${LINE};"><tr><td width="50%" valign="top" style="padding:8px 8px 0 0;">${p.items.slice(0, half).map(bullet).join('')}</td><td width="50%" valign="top" style="padding:8px 0 0 12px;border-left:1px solid ${LINE};">${p.items.slice(half).map(bullet).join('')}</td></tr></table></td>
</tr></table></td></tr>`
}

export function developerMissingInfoSubject(count: number): string {
  return `${count} of your projects are live: a few quick details on each`
}

export function renderDeveloperMissingInfoHTML(input: { developerName: string; projects: MissingInfoProject[] }): string {
  const n = input.projects.length
  const body = [
    emailHero(`${n} of your projects are live. A few quick details on each.`, 'One short list per project. Reply to this email with the answers.'),
    emailPara(`Hello ${esc(input.developerName)} team, thank you for your projects on LankaNewHomes. Here is what <span style="color:${OR};font-weight:700;">we still need</span>, project by project.`),
    `  <tr><td style="padding:14px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${input.projects.map(card).join('')}</table></td></tr>`,
    emailPanel({ heading: 'Get your Verified Developer badge', pill: true, tint: '#f1fbfd', bodyHtml: `Free, and it shows on your company page and every listing. Register at <a href="${SITE}/developers/register" style="color:#1c1c20;">lankanewhomes.com/developers/register</a> with an email on your own website, click the confirmation link, then log in.` }),
    emailButton('Register and get verified', `${SITE}/developers/register`),
    emailSignoff(),
  ].join('\n')
  return emailShell({ preheader: `${n} projects, a few quick details on each.`, title: 'Your projects on LankaNewHomes', body })
}

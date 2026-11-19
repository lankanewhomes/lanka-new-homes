import { emailButton, emailHero, emailPanel, emailShell, emailSignoff, esc } from './email-layout'
import { listUnsubscribeHeaders, unsubscribeUrl } from './unsubscribe'

// The newsletter / updates email (owner, 2026-11-18: "when I send that newsletter it should have the unsubscribe link for sure, all the way
// to the end"). Every marketing email is built here so the unsubscribe line is always the very last thing, and the mail app's own
// Unsubscribe button is switched on through the headers. Only send to people whose status is "subscribed" in Contacts & subscribers.
export type NewsletterItem = { title: string; text: string; href?: string; cta?: string }
export type NewsletterInput = { subject: string; intro: string; items: NewsletterItem[]; email: string }

export async function renderNewsletter(i: NewsletterInput): Promise<{ subject: string; html: string; text: string; headers: Record<string, string> }> {
  const url = await unsubscribeUrl(i.email)
  const body = [
    emailHero(esc(i.subject), esc(i.intro)),
    ...i.items.map((it) => emailPanel({ heading: esc(it.title), bodyHtml: esc(it.text) }) + (it.href ? `\n${emailButton(esc(it.cta ?? 'Read more'), it.href)}` : '')),
    emailSignoff(),
  ].join('\n')
  const lastRow = `  <tr><td style="padding:16px 32px 22px;background:#ffffff;font-size:12px;line-height:1.6;color:#8a8a8a;text-align:center;">You are receiving this email because you asked for updates from LankaNewHomes.<br><a href="${url}" style="color:#6b6b6b;text-decoration:underline;">Unsubscribe from all emails</a></td></tr>`
  const html = emailShell({ preheader: i.intro, title: i.subject, body, footerNote: 'LankaNewHomes, new homes and land for sale in Sri Lanka.', lastRow })
  const text = `${i.subject}\n\n${i.intro}\n\n${i.items.map((it) => `${it.title}\n${it.text}${it.href ? `\n${it.href}` : ''}`).join('\n\n')}\n\nThe LankaNewHomes team\n\nYou are receiving this because you asked for updates from LankaNewHomes. Unsubscribe from all emails: ${url}\n`
  return { subject: i.subject, html, text, headers: await listUnsubscribeHeaders(i.email) }
}

export const SAMPLE_NEWSLETTER: Omit<NewsletterInput, 'email'> = {
  subject: 'New homes this month (sample)',
  intro: 'This is a sample newsletter, so you can see where the unsubscribe link sits.',
  items: [
    { title: 'New listings and price drops', text: 'A short line about a new project or a price change goes here.', href: 'https://www.lankanewhomes.com/projects', cta: 'See listings' },
    { title: 'Latest news', text: 'A short line about the Sri Lanka property market goes here.', href: 'https://www.lankanewhomes.com/blog', cta: 'Read more' },
  ],
}

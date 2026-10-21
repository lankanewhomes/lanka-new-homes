// Click tracking for platform emails (owner, 2026-10-18: "track everything on the website's emails").
//
// sendMail (src/lib/mailer.ts) rewrites every link in an email's HTML to  <site>/e/<trackId>?u=<link>&b=<button>&s=<signature>.
// /e/[id] verifies the signature (so it can't be used as an open redirect), adds the click to the email's row in the email log
// (shown on the developer's Emails tab) and forwards to the real link. Not rewritten: the signed lead-reply buttons (they already
// record the tap on the lead), links that carry a login/reset/verification token, and the logo.

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lankanewhomes.com'

const secret = () => {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is not set — cannot sign email links')
  return value
}

export const newTrackId = () => randomBytes(9).toString('base64url')

const sign = (trackId: string, url: string, button: string) =>
  createHmac('sha256', secret()).update(`email-click:${trackId}:${url}:${button}`).digest('base64url').slice(0, 32)

export function verifyEmailClick(trackId: string, url: string, button: string, token: string): boolean {
  const expected = Buffer.from(sign(trackId, url, button))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

const decodeEntities = (v: string) => v.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
const plain = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')).replace(/\s+/g, ' ').trim()

/** The name shown in the log: WhatsApp / Call / Email, or the button's own text (View listing, Register, Download brochure…). */
export function buttonLabel(url: string, anchorHtml: string): string {
  if (/^tel:/i.test(url)) return 'Call'
  if (/^mailto:/i.test(url)) return 'Email'
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\b/i.test(url)) return 'WhatsApp'
  const text = plain(anchorHtml).replace(/[→›»]+$/, '').trim()
  return (text || 'Link').slice(0, 60)
}

const SKIP = /\/api\/leads\/reply|\/e\/[A-Za-z0-9_-]+\?|[?&](token|code|key)=|\/reset-password|\/verify|magic|\/auth\//i

export function trackLinks(html: string, trackId: string): string {
  return html.replace(/<a\b([^>]*?)\bhref="([^"]*)"([^>]*)>([\s\S]*?)<\/a>/gi, (whole, pre: string, rawHref: string, post: string, inner: string) => {
    const url = decodeEntities(rawHref).trim()
    if (!/^(https?:|tel:|mailto:)/i.test(url) || SKIP.test(url) || /<img\b/i.test(inner)) return whole
    const button = buttonLabel(url, inner)
    const link = `${SITE}/e/${trackId}?${new URLSearchParams({ u: url, b: button, s: sign(trackId, url, button) }).toString()}`
    return `<a${pre}href="${link.replace(/&/g, '&amp;')}"${post}>${inner}</a>`
  })
}

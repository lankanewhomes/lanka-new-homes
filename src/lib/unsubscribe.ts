// Unsubscribe links for newsletters and any other marketing email (owner, 2026-11-18: "they can unsubscribe to all the newsletter or
// anything that I send"). The link carries the email and an HMAC of it, so nobody can unsubscribe somebody else by guessing. Works on
// Cloudflare Workers (Web Crypto only). Put unsubscribeFooterHtml(email) at the bottom of every marketing email and spread
// listUnsubscribeHeaders(email) into its headers, so Gmail and Apple Mail show their own "Unsubscribe" button too.
const SITE = 'https://www.lankanewhomes.com'

async function hmac(email: string): Promise<string> {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('Unsubscribe links need PAYLOAD_SECRET (or UNSUBSCRIBE_SECRET).')
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(`unsubscribe:${email.trim().toLowerCase()}`)))
  return Array.from(sig.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function unsubscribeUrl(email: string): Promise<string> {
  const e = email.trim().toLowerCase()
  return `${SITE}/unsubscribe?e=${encodeURIComponent(e)}&t=${await hmac(e)}`
}

export async function verifyUnsubscribe(email: string, token: string): Promise<boolean> {
  if (!email || !token) return false
  const expected = await hmac(email)
  if (expected.length !== token.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i)
  return diff === 0
}

/** Small grey line for the bottom of a marketing email. */
export async function unsubscribeFooterHtml(email: string): Promise<string> {
  const url = await unsubscribeUrl(email)
  return `<p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#8a8a8a;">You are receiving this because you asked for updates from LankaNewHomes. <a href="${url}" style="color:#6b6b6b;text-decoration:underline;">Unsubscribe from all emails</a>.</p>`
}

/** Extra email headers: shows the mail app's own Unsubscribe button (RFC 8058 one-click). */
export async function listUnsubscribeHeaders(email: string): Promise<Record<string, string>> {
  return { 'List-Unsubscribe': `<${await unsubscribeUrl(email)}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
}

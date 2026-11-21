// Registers support@, developers@ and no-reply@ as "send mail as" addresses of the one Google mailbox, so mail sent from an alias keeps that
// address in From (otherwise Google rewrites it to the primary address). Safe to run twice.
// Needs the delegation entry for the service account to include the scope https://www.googleapis.com/auth/gmail.settings.sharing
// (Admin console > Security > API controls > Domain-wide delegation > edit the entry, add the scope after a comma).
//   npx tsx scripts/google-register-aliases.mts
import { config } from 'dotenv'
config({ path: '.env.local' })
const { aliasesFor, googlePrimaryMailbox } = await import('../src/lib/mail/index')
const email = process.env.GOOGLE_MAIL_SA_EMAIL ?? ''
const key = process.env.GOOGLE_MAIL_SA_KEY ?? ''
const primary = googlePrimaryMailbox()
const enc = new TextEncoder()
const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const part = (o: object) => b64u(enc.encode(JSON.stringify(o)))
const now = Math.floor(Date.now() / 1000)
const unsigned = `${part({ alg: 'RS256', typ: 'JWT' })}.${part({ iss: email, sub: primary, scope: 'https://www.googleapis.com/auth/gmail.settings.sharing', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`
const pem = key.replace(/\\n/g, '\n').replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '')
const k = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', k, enc.encode(unsigned)))
const tokenRes = (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${b64u(sig)}` }) })).json()) as { access_token?: string; error_description?: string }
if (!tokenRes.access_token) throw new Error(`Google refused the settings scope: ${tokenRes.error_description ?? 'unknown'}. Add the gmail.settings.sharing scope to the delegation entry first.`)
const api = 'https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs'
const headers = { authorization: `Bearer ${tokenRes.access_token}`, 'content-type': 'application/json' }
const existing = ((await (await fetch(api, { headers })).json()) as { sendAs?: { sendAsEmail: string }[] }).sendAs ?? []
for (const alias of aliasesFor(primary)) {
  if (existing.some((s) => s.sendAsEmail.toLowerCase() === alias)) { console.log('already registered:', alias); continue }
  const res = await fetch(api, { method: 'POST', headers, body: JSON.stringify({ sendAsEmail: alias, displayName: alias.startsWith('support') ? 'LankaNewHomes Support' : alias.startsWith('developers') ? 'LankaNewHomes Developers' : 'LankaNewHomes', treatAsAlias: true }) })
  console.log(res.ok ? 'registered:' : `FAILED (${res.status}):`, alias, res.ok ? '' : (await res.text()).slice(0, 160))
}

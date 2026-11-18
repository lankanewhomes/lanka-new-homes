import { MockMailProvider } from './mock-client'
import type { MailProvider } from './types'

// Provider factory. MAIL_MOCK_MODE=true (the default) or missing credentials gives the mock client; otherwise the real client: Google
// Workspace (Gmail API) when MAIL_PROVIDER=google (owner, 2026-11-17: moving away from Zoho), else Zoho. Both implement MailProvider, so the rest of the app never knows which one it is talking to.

export const MAILBOX_ENV = [
  { env: 'MAIL_ACCOUNT_NOREPLY', fallback: 'no-reply@lankanewhomes.com', suffix: 'NOREPLY' },
  { env: 'MAIL_ACCOUNT_SUPPORT', fallback: 'support@lankanewhomes.com', suffix: 'SUPPORT' },
  { env: 'MAIL_ACCOUNT_DEVELOPERS', fallback: 'developers@lankanewhomes.com', suffix: 'DEVELOPERS' },
] as const

export type ZohoCreds = { clientId: string; clientSecret: string; refreshToken: string }

/**
 * Zoho keys for one mailbox. Each mailbox may have its own Self Client (ZOHO_CLIENT_ID_SUPPORT, ZOHO_CLIENT_SECRET_SUPPORT,
 * ZOHO_REFRESH_TOKEN_SUPPORT, …) because a Zoho login only sees its own mailbox; any key left out falls back to the shared ZOHO_* one.
 */
export function zohoCredsFor(email: string): ZohoCreds | null {
  const box = MAILBOX_ENV.find((m) => (process.env[m.env] || m.fallback).trim().toLowerCase() === email.toLowerCase())
  const pick = (name: string) => (box ? process.env[`${name}_${box.suffix}`] : '') || process.env[name] || ''
  const creds = { clientId: pick('ZOHO_CLIENT_ID'), clientSecret: pick('ZOHO_CLIENT_SECRET'), refreshToken: pick('ZOHO_REFRESH_TOKEN') }
  return creds.clientId && creds.clientSecret && creds.refreshToken ? creds : null
}

export function configuredMailboxes(): string[] {
  return MAILBOX_ENV.map((m) => (process.env[m.env] || m.fallback).trim().toLowerCase())
}

export function zohoCredentialsPresent(): boolean {
  return configuredMailboxes().some((email) => zohoCredsFor(email) !== null)
}

/** True when the mail provider is Google Workspace (MAIL_PROVIDER=google). */
export function isGoogleMail(): boolean {
  return (process.env.MAIL_PROVIDER ?? '').toLowerCase() === 'google'
}

export function liveCredentialsPresent(): boolean {
  return isGoogleMail() ? Boolean(process.env.GOOGLE_MAIL_SA_EMAIL && process.env.GOOGLE_MAIL_SA_KEY) : zohoCredentialsPresent()
}

export function isMockMode(): boolean {
  const flag = (process.env.MAIL_MOCK_MODE ?? 'true').toLowerCase()
  return flag !== 'false' || !liveCredentialsPresent()
}

const KEY = Symbol.for('lnh.mail.provider')

export async function getMailProvider(): Promise<MailProvider> {
  const g = globalThis as unknown as Record<symbol, { mock: boolean; google: boolean; provider: MailProvider } | undefined>
  const mock = isMockMode()
  const google = !mock && isGoogleMail()
  if (g[KEY]?.mock === mock && g[KEY]?.google === google) return g[KEY]!.provider
  let provider: MailProvider
  if (mock) provider = new MockMailProvider()
  else if (google) {
    const { GmailMailProvider } = await import('./gmail-client')
    provider = new GmailMailProvider()
  } else {
    const { ZohoMailProvider } = await import('./zoho-client')
    provider = new (ZohoMailProvider as unknown as new () => MailProvider)()
  }
  g[KEY] = { mock, google, provider }
  return provider
}

export * from './types'

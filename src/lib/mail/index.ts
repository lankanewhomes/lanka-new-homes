import { MockMailProvider } from './mock-client'
import type { MailProvider } from './types'

// Provider factory. MAIL_MOCK_MODE=true (the default) or missing Zoho credentials gives the mock client; otherwise the real Zoho
// client. Both implement MailProvider, so the rest of the app never knows which one it is talking to.

export const MAILBOX_ENV = [
  { env: 'MAIL_ACCOUNT_NOREPLY', fallback: 'no-reply@lankanewhomes.com' },
  { env: 'MAIL_ACCOUNT_SUPPORT', fallback: 'support@lankanewhomes.com' },
  { env: 'MAIL_ACCOUNT_DEVELOPERS', fallback: 'developers@lankanewhomes.com' },
] as const

export function configuredMailboxes(): string[] {
  return MAILBOX_ENV.map((m) => (process.env[m.env] || m.fallback).trim().toLowerCase())
}

export function zohoCredentialsPresent(): boolean {
  return Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN)
}

export function isMockMode(): boolean {
  const flag = (process.env.MAIL_MOCK_MODE ?? 'true').toLowerCase()
  return flag !== 'false' || !zohoCredentialsPresent()
}

const KEY = Symbol.for('lnh.mail.provider')

export async function getMailProvider(): Promise<MailProvider> {
  const g = globalThis as unknown as Record<symbol, { mock: boolean; provider: MailProvider } | undefined>
  const mock = isMockMode()
  if (g[KEY]?.mock === mock) return g[KEY]!.provider
  let provider: MailProvider
  if (mock) provider = new MockMailProvider()
  else {
    const { ZohoMailProvider } = await import('./zoho-client')
    provider = new (ZohoMailProvider as unknown as new () => MailProvider)()
  }
  g[KEY] = { mock, provider }
  return provider
}

export * from './types'

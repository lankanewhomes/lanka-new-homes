import { MockMailProvider } from './mock-client'
import type { MailProvider } from './types'

// Provider factory. MAIL_MOCK_MODE=true (the default) or missing Google keys gives the mock client; otherwise Google Workspace (Gmail API).
// Google is the only live provider (owner, 2026-11-23; the old provider's client was deleted). Both clients implement MailProvider, so the
// rest of the app never knows which one it is talking to.

export const MAILBOX_ENV = [
  { env: 'MAIL_ACCOUNT_NOREPLY', fallback: 'no-reply@lankanewhomes.com' },
  { env: 'MAIL_ACCOUNT_SUPPORT', fallback: 'support@lankanewhomes.com' },
  { env: 'MAIL_ACCOUNT_DEVELOPERS', fallback: 'developers@lankanewhomes.com' },
] as const

/** The three public addresses (support, developers, no-reply). */
export function publicAddresses(): string[] {
  return MAILBOX_ENV.map((m) => (process.env[m.env] || m.fallback).trim().toLowerCase())
}

/** Google Workspace keeps one real mailbox; the public addresses are aliases of it (owner, 2026-11-18, "option A, cheapest"). */
export function googlePrimaryMailbox(): string {
  return (process.env.GOOGLE_MAIL_PRIMARY || 'rupan@lankanewhomes.com').trim().toLowerCase()
}

/** Mailboxes the app syncs: the mock keeps three sample ones; Google is one mailbox with aliases. */
export function configuredMailboxes(): string[] {
  return !isMockMode() ? [googlePrimaryMailbox()] : publicAddresses()
}

/** Addresses mail can be sent as from a mailbox: its aliases (Google only). */
export function aliasesFor(email: string): string[] {
  if (isMockMode() || email.toLowerCase() !== googlePrimaryMailbox()) return []
  return publicAddresses().filter((a) => a !== googlePrimaryMailbox())
}

export function liveCredentialsPresent(): boolean {
  return Boolean(process.env.GOOGLE_MAIL_SA_EMAIL && process.env.GOOGLE_MAIL_SA_KEY)
}

export function isMockMode(): boolean {
  const flag = (process.env.MAIL_MOCK_MODE ?? 'true').toLowerCase()
  return flag !== 'false' || !liveCredentialsPresent()
}

const KEY = Symbol.for('lnh.mail.provider')

export async function getMailProvider(): Promise<MailProvider> {
  const g = globalThis as unknown as Record<symbol, { mock: boolean; provider: MailProvider } | undefined>
  const mock = isMockMode()
  if (g[KEY]?.mock === mock) return g[KEY]!.provider
  let provider: MailProvider
  if (mock) provider = new MockMailProvider()
  else {
    const { GmailMailProvider } = await import('./gmail-client')
    provider = new GmailMailProvider()
  }
  g[KEY] = { mock, provider }
  return provider
}

export * from './types'

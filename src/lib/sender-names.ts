// The display name shown next to each LankaNewHomes sending address (owner, 2026-11-18). One list, used by every outgoing path
// (Resend in mailer.ts, the Payload email adapter, the Gmail mailbox) so the name never drifts from the address.
export const SENDER_NAMES: Record<string, string> = {
  'no-reply@lankanewhomes.com': 'Notifications | LankaNewHomes',
  'support@lankanewhomes.com': 'Support | LankaNewHomes',
  'developers@lankanewhomes.com': 'Developers | LankaNewHomes',
  'rupan@lankanewhomes.com': 'Rupan Sinnarajah | LankaNewHomes',
}

export const DEFAULT_SENDER = 'no-reply@lankanewhomes.com'

/** Turns an address (or an existing `Name <address>` string) into a From header. Our own addresses always get their name from the list above, quoted because it contains "|". Any other address keeps the name it came with. */
export function senderHeader(from?: string, fallbackAddress = DEFAULT_SENDER): string {
  const raw = (from || fallbackAddress).trim()
  const angle = raw.match(/<([^>]+)>/)
  const address = (angle ? angle[1] : raw).trim()
  const name = SENDER_NAMES[address.toLowerCase()]
  if (name) return `"${name}" <${address}>`
  return angle ? raw : `LankaNewHomes <${address}>`
}

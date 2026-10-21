/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
// Records each outgoing email against the developer(s) it went to. Called from sendMail (src/lib/mailer.ts) after Resend accepts the
// message, so every channel is covered: lead alerts, Verified Developer, invites, digests, password and confirmation emails.
// Best effort: a logging problem never stops or fails an email.

type Msg = { to: string | string[]; from?: string; subject: string; html?: string; text?: string; bcc?: string | string[] }

const list = (v?: string | string[]) => (v === undefined ? [] : Array.isArray(v) ? v : [v])
const addr = (v: string) => (v.match(/<([^>]+)>/)?.[1] ?? v).trim().toLowerCase()

export function classifyEmail(subject: string): string {
  const s = subject.toLowerCase()
  if (/verified developer/.test(s)) return 'Verified Developer'
  if (/new (lead|enquiry|inquiry)|enquiry|inquiry|lead/.test(s)) return 'Lead alert'
  if (/reset your|password/.test(s)) return 'Password'
  if (/confirm your|verify|verification/.test(s)) return 'Confirmation'
  if (/invite|claim|join|your listing|listings? (is|are)/.test(s)) return 'Invite / listing'
  if (/weekly|digest|report|performance/.test(s)) return 'Report'
  return 'Other'
}

export async function logEmailForDevelopers(message: Msg, resendId?: string, trackId?: string): Promise<void> {
  try {
    const recipients = [...new Set([...list(message.to), ...list(message.bcc)].map(addr).filter((e) => e.includes('@')))]
    if (!recipients.length) return
    const { default: config } = await import('../../payload.config')
    const { getPayload } = await import('payload')
    const payload = await getPayload({ config })
    const devs = new Map<number, any>()
    const lookups = [{ contact_email: { in: recipients } }, { verified_email: { in: recipients } }, { 'lead_alerts.email': { in: recipients } }]
    for (const where of lookups) {
      const r = await payload.find({ collection: 'developers', where: where as never, limit: 10, depth: 0, overrideAccess: true })
      for (const d of r.docs as any[]) devs.set(d.id, d)
    }
    const users = await payload.find({ collection: 'users', where: { email: { in: recipients } } as never, limit: 10, depth: 0, overrideAccess: true })
    if (users.docs.length) {
      const r = await payload.find({ collection: 'developers', where: { user: { in: users.docs.map((u: any) => u.id) } } as never, limit: 10, depth: 0, overrideAccess: true })
      for (const d of r.docs as any[]) devs.set(d.id, d)
    }
    for (const d of devs.values()) {
      await payload.create({
        collection: 'email-log' as never,
        overrideAccess: true,
        data: {
          developer: d.id, developerName: d.name, kind: classifyEmail(message.subject), subject: message.subject,
          toEmail: list(message.to).join(', '), fromEmail: message.from ?? 'no-reply@lankanewhomes.com', bccEmail: list(message.bcc).join(', ') || undefined,
          htmlBody: message.html, textBody: message.text, resendId, trackId, sentAt: new Date().toISOString(),
        } as never,
      })
    }
  } catch (error) {
    console.error('email log failed:', error instanceof Error ? error.message : error)
  }
}

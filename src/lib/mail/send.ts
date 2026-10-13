import { isMockMode, getMailProvider } from './index'
import { sendMail } from '../mailer'

// Sends an email that a person wrote (outreach to developers, follow-ups, replies) through the Zoho mailbox it comes from, so it
// shows in Zoho's Sent folder and in /cms/mail. Automatic site emails (lead alerts, password resets, digests) keep using Resend directly.
// Until the Zoho keys are set (mock mode) or when Zoho refuses the send, it falls back to Resend, so nothing is ever lost.

export type HumanEmail = {
  /** The mailbox address it is sent from, e.g. developers@lankanewhomes.com. */
  from: string
  fromName?: string
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  replyTo?: string
  subject: string
  html: string
  text?: string
  /** Test sends (local / preview): always use Resend, never a real mailbox. */
  forceResend?: boolean
  /** When it goes out through Resend, also BCC the sending mailbox so a copy lands in Zoho. */
  copyToSender?: boolean
}

const list = (v?: string | string[]) => (v === undefined ? [] : Array.isArray(v) ? v : [v])

export async function sendHumanEmail(email: HumanEmail): Promise<{ via: 'zoho' | 'resend'; id?: string }> {
  if (!email.forceResend && !isMockMode()) {
    try {
      const provider = await getMailProvider()
      const account = (await provider.listAccounts()).find((a) => a.email.toLowerCase() === email.from.toLowerCase())
      if (account) {
        const sent = await provider.sendMessage(account.zohoAccountId, {
          from: email.from,
          to: list(email.to).map((address) => ({ email: address })),
          cc: list(email.cc).map((address) => ({ email: address })),
          bcc: list(email.bcc).map((address) => ({ email: address })),
          subject: email.subject,
          htmlBody: email.html,
        })
        return { via: 'zoho', id: sent.zohoMessageId }
      }
    } catch (error) {
      console.warn('Zoho send failed, falling back to Resend:', error instanceof Error ? error.message : error)
    }
  }
  const sent = await sendMail({
    from: email.fromName ? `${email.fromName} <${email.from}>` : email.from,
    to: list(email.to),
    cc: list(email.cc),
    bcc: [...list(email.bcc), ...(email.copyToSender ? [email.from] : [])],
    replyTo: email.replyTo ?? email.from,
    subject: email.subject,
    html: email.html,
    text: email.text,
  })
  return { via: 'resend', id: sent.id }
}

import type { EmailAdapter, SendEmailOptions } from 'payload'

// All outbound mail goes to Resend over HTTPS. The old path opened a raw SMTP
// connection (nodemailer), which hangs on Cloudflare Workers — the password
// reset, verification, lead-alert, contact-form and digest emails never left.
// Resend's SMTP password IS its API key (SMTP_PASS), so no new secret is needed.

type MailMessage = {
  to: string | string[]
  from?: string
  subject: string
  html?: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  headers?: Record<string, string>
}

const list = (value?: string | string[]) => (value === undefined ? undefined : Array.isArray(value) ? value : [value])

function withName(from: string | undefined, fallbackName = 'LankaNewHomes') {
  const address = from || process.env.EMAIL_FROM || 'no-reply@lankanewhomes.com'
  return address.includes('<') ? address : `${fallbackName} <${address}>`
}

export async function sendMail(message: MailMessage): Promise<{ id?: string }> {
  const apiKey = process.env.RESEND_API_KEY || process.env.SMTP_PASS
  if (!apiKey) throw new Error('Email is not configured: set SMTP_PASS (the Resend API key).')
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: withName(message.from),
      to: list(message.to),
      subject: message.subject,
      html: message.html,
      text: message.text,
      reply_to: message.replyTo,
      cc: list(message.cc),
      bcc: list(message.bcc),
      headers: message.headers,
    }),
    signal: AbortSignal.timeout(20_000),
  })
  const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string }
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}): ${body.message ?? 'unknown error'}`)
  return { id: body.id }
}

// Drop-in for the `transporter.sendMail(...)` calls that used nodemailer.
export function createMailTransport() {
  return { sendMail }
}

// Payload's email adapter (password reset, verification, sendEmail()).
export const resendEmailAdapter: EmailAdapter = ({ payload: _payload }) => ({
  name: 'resend-http',
  defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@lankanewhomes.com',
  defaultFromName: 'LankaNewHomes',
  sendEmail: async (message: SendEmailOptions) => {
    const first = (value: unknown) => (typeof value === 'string' ? value : undefined)
    const toArray = (value: unknown): string[] | undefined =>
      value === undefined ? undefined : (Array.isArray(value) ? value : [value]).map((v) => (typeof v === 'string' ? v : (v as { address?: string }).address ?? ''))
    const result = await sendMail({
      to: toArray(message.to) ?? [],
      from: first(message.from),
      subject: message.subject ?? '',
      html: first(message.html),
      text: first(message.text),
      replyTo: first(message.replyTo),
      cc: toArray(message.cc),
      bcc: toArray(message.bcc),
    })
    return result
  },
})

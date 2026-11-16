// Incoming WhatsApp Cloud API webhooks (Meta → POST /api/whatsapp/webhook).
//
// Meta calls the webhook for every message someone sends to the LankaNewHomes WhatsApp Business number (+1 647-779-5729) and
// for delivery updates on the messages we send (lead alerts). This file holds the pure parts, so they can be unit tested:
//   - the one-time GET verification ("hub.challenge"),
//   - the X-Hub-Signature-256 check (HMAC-SHA256 of the raw body with the Meta app secret; Web Crypto, so it runs on Workers),
//   - turning Meta's nested payload into flat messages / status updates,
//   - the owner's "new WhatsApp message" notice email.
// The route (src/app/(frontend)/api/whatsapp/webhook/route.ts) does the sending. Setup: docs/design.md, "Incoming WhatsApp messages".

import { emailButtonRow, emailFacts, emailHero, emailPara, emailShell, esc, WHATSAPP_BUTTON } from './email-layout'

export type WhatsAppInboundMessage = {
  /** Meta's message id ("wamid.…"), used to drop duplicate deliveries. */
  id: string
  /** Sender as Meta sends it: international digits, or a business-scoped user id for people who use a WhatsApp username. */
  from: string
  /** The sender's number in international digits, when `from` is a phone number. */
  phone: string | null
  /** The sender's WhatsApp profile name. */
  name: string | null
  /** Meta's message type: text, button, interactive, image, document, location… */
  type: string
  /** What they sent, readable: the text itself, the button they tapped, "[Photo] caption"… */
  text: string
  receivedAt: Date
  /** Our business number that received it (display form, digits). */
  toNumber: string | null
  phoneNumberId: string | null
}

export type WhatsAppStatusUpdate = {
  id: string
  /** sent | delivered | read | failed */
  status: string
  recipient: string | null
  at: Date
  errors: { code?: number; title?: string; message?: string; details?: string }[]
}

type Obj = Record<string, unknown>

const obj = (value: unknown): Obj => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Obj) : {})
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const str = (value: unknown): string => (typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '')

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

/**
 * Meta's subscribe check: GET ?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…. Returns the challenge to echo back when the
 * token matches WHATSAPP_WEBHOOK_VERIFY_TOKEN, otherwise null (answer 403). No token configured means no subscription is possible.
 */
export function verifyWebhookChallenge(params: URLSearchParams, verifyToken: string | undefined): string | null {
  if (!verifyToken) return null
  if (params.get('hub.mode') !== 'subscribe') return null
  if (!timingSafeEqual(params.get('hub.verify_token') ?? '', verifyToken)) return null
  return params.get('hub.challenge') ?? ''
}

/** True when `header` ("sha256=<hex>") is the HMAC-SHA256 of the exact raw body bytes, keyed with the Meta app secret. */
export async function verifyWhatsAppSignature(rawBody: ArrayBuffer, header: string | null, appSecret: string): Promise<boolean> {
  if (!header || !appSecret) return false
  const match = /^sha256=([0-9a-f]{64})$/i.exec(header.trim())
  if (!match) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(appSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, rawBody))
  const expected = Array.from(mac, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(expected, match[1].toLowerCase())
}

const MEDIA_LABEL: Record<string, string> = { image: 'Photo', video: 'Video', sticker: 'Sticker' }

/** One readable line for any message type. Media can't be shown in an email, so it is named, with its caption. */
export function describeMessage(message: Obj): string {
  const type = str(message.type)
  const withCaption = (label: string, caption: string) => (caption ? `[${label}] ${caption}` : `[${label}]`)
  let line: string
  switch (type) {
    case 'text':
      line = str(obj(message.text).body)
      break
    case 'button': // a quick-reply button on one of our templates
      line = `Tapped "${str(obj(message.button).text) || str(obj(message.button).payload)}"`
      break
    case 'interactive': {
      const interactive = obj(message.interactive)
      const reply = obj(interactive.button_reply ?? interactive.list_reply ?? interactive.nfm_reply)
      line = `Chose "${str(reply.title) || str(reply.name) || str(reply.id)}"${str(reply.description) ? ` (${str(reply.description)})` : ''}`
      break
    }
    case 'image':
    case 'video':
    case 'sticker':
      line = withCaption(MEDIA_LABEL[type], str(obj(message[type]).caption))
      break
    case 'audio':
      line = obj(message.audio).voice === true ? '[Voice note]' : '[Audio]'
      break
    case 'document': {
      const document = obj(message.document)
      line = withCaption(str(document.filename) ? `Document: ${str(document.filename)}` : 'Document', str(document.caption))
      break
    }
    case 'location': {
      const location = obj(message.location)
      const place = [str(location.name), str(location.address)].filter(Boolean).join(', ')
      const lat = str(location.latitude)
      const lng = str(location.longitude)
      line = `[Location]${place ? ` ${place}` : ''}${lat && lng ? ` https://maps.google.com/?q=${lat},${lng}` : ''}`
      break
    }
    case 'contacts': {
      const cards = arr(message.contacts).map((card) => {
        const c = obj(card)
        const phones = arr(c.phones).map((p) => str(obj(p).phone)).filter(Boolean)
        return [str(obj(c.name).formatted_name), ...phones].filter(Boolean).join(' ')
      })
      line = `[Contact card] ${cards.join('; ')}`.trim()
      break
    }
    case 'reaction': {
      const emoji = str(obj(message.reaction).emoji)
      line = emoji ? `[Reacted ${emoji}]` : '[Removed a reaction]'
      break
    }
    case 'order':
      line = '[Order from the catalog]'
      break
    case 'system':
      line = str(obj(message.system).body) || '[System message]'
      break
    case 'request_welcome':
      line = '[Opened a chat for the first time]'
      break
    default:
      line = '[Message type WhatsApp does not support yet]'
  }
  // A chat started from a Click-to-WhatsApp ad or a Facebook post carries a referral: say which.
  const referral = obj(message.referral)
  const from = str(referral.headline) || str(referral.source_url)
  if (from) line = `${line} (came from: ${from})`
  return line || '[Empty message]'
}

/** Flattens Meta's entry → changes → value payload. Anything malformed is skipped, never thrown. */
export function parseWhatsAppWebhook(body: unknown): { messages: WhatsAppInboundMessage[]; statuses: WhatsAppStatusUpdate[] } {
  const messages: WhatsAppInboundMessage[] = []
  const statuses: WhatsAppStatusUpdate[] = []
  const root = obj(body)
  if (root.object !== 'whatsapp_business_account') return { messages, statuses }

  for (const entry of arr(root.entry)) {
    for (const change of arr(obj(entry).changes)) {
      if (obj(change).field !== 'messages') continue
      const value = obj(obj(change).value)
      const metadata = obj(value.metadata)
      const contacts = arr(value.contacts).map(obj)

      for (const raw of arr(value.messages)) {
        const message = obj(raw)
        const id = str(message.id)
        const from = str(message.from) || str(message.from_user_id)
        if (!id || !from) continue
        const contact = contacts.find((c) => str(c.wa_id) === from || str(c.user_id) === from) ?? contacts[0] ?? {}
        const digits = /^\d{6,15}$/.test(from) ? from : /^\d{6,15}$/.test(str(contact.wa_id)) ? str(contact.wa_id) : null
        messages.push({
          id,
          from,
          phone: digits,
          name: str(obj(contact.profile).name) || null,
          type: str(message.type) || 'unknown',
          text: describeMessage(message),
          receivedAt: unixToDate(message.timestamp),
          toNumber: str(metadata.display_phone_number).replace(/\D/g, '') || null,
          phoneNumberId: str(metadata.phone_number_id) || null,
        })
      }

      for (const raw of arr(value.statuses)) {
        const status = obj(raw)
        const id = str(status.id)
        if (!id) continue
        statuses.push({
          id,
          status: str(status.status),
          recipient: str(status.recipient_id) || null,
          at: unixToDate(status.timestamp),
          errors: arr(status.errors).map((e) => {
            const error = obj(e)
            return { code: typeof error.code === 'number' ? error.code : undefined, title: str(error.title) || undefined, message: str(error.message) || undefined, details: str(obj(error.error_data).details) || undefined }
          }),
        })
      }
    }
  }
  return { messages, statuses }
}

function unixToDate(value: unknown): Date {
  const seconds = Number(str(value))
  return Number.isFinite(seconds) && seconds > 0 ? new Date(seconds * 1000) : new Date()
}

const senderLabel = (m: WhatsAppInboundMessage) => m.name || (m.phone ? `+${m.phone}` : 'Someone')

function snippet(text: string, max = 70): string {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

const receivedLabel = (m: WhatsAppInboundMessage) =>
  m.receivedAt.toLocaleString('en-CA', { timeZone: 'America/Toronto', weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

export function inboundNoticeSubject(m: WhatsAppInboundMessage): string {
  return `WhatsApp from ${senderLabel(m)}${m.name && m.phone ? ` (+${m.phone})` : ''}: ${snippet(m.text)}`
}

export function renderInboundNoticeHTML(m: WhatsAppInboundMessage): string {
  const rows: [string, string][] = [
    ['From', m.name ? esc(m.name) : ''],
    ['Number', esc(m.phone ? `+${m.phone}` : m.from)],
    ['Message', m.type === 'text' ? `“${esc(m.text).replace(/\n/g, '<br>')}”` : esc(m.text)],
    ['Sent to', m.toNumber ? esc(`+${m.toNumber}`) : ''],
    ['Received', esc(receivedLabel(m))],
  ]
  const body = [
    emailHero(`New WhatsApp message from ${esc(senderLabel(m))}.`, 'Someone messaged your WhatsApp Business number.'),
    emailFacts(rows),
    m.phone ? emailButtonRow([{ label: 'Reply on WhatsApp', href: `https://wa.me/${m.phone}`, ...WHATSAPP_BUTTON }, { label: 'Call', href: `tel:+${m.phone}` }]) : '',
    emailPara('Reply on WhatsApp opens the chat from your own WhatsApp, not from the business number. The business number can only answer through the WhatsApp API: free text within 24 hours of their last message, an approved template after that.', true),
    '  <tr><td style="padding:4px 32px 24px;"></td></tr>',
  ].join('\n')
  return emailShell({
    preheader: `${senderLabel(m)}: ${snippet(m.text, 120)}`,
    title: 'New WhatsApp message',
    body,
    footerNote: 'Internal notice from LankaNewHomes. Sent for every message to your WhatsApp Business number.',
  })
}

export function renderInboundNoticeText(m: WhatsAppInboundMessage): string {
  return [
    `New WhatsApp message from ${senderLabel(m)}`,
    '',
    m.name ? `From: ${m.name}` : null,
    `Number: ${m.phone ? `+${m.phone}` : m.from}`,
    `Message: ${m.text}`,
    m.toNumber ? `Sent to: +${m.toNumber}` : null,
    `Received: ${receivedLabel(m)}`,
    m.phone ? `\nReply on WhatsApp (from your own WhatsApp): https://wa.me/${m.phone}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

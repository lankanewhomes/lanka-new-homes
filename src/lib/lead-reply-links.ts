// Signed one-tap reply links for lead alert emails.
//
// The developer taps "Reply on WhatsApp" / "Call" / "Email" in the alert;
// the link goes through /api/leads/reply, which marks the lead Contacted
// (stamping the response time — hooks/lead-hooks.ts stampFirstResponse)
// and then forwards to wa.me / tel: / mailto:. So replying the way they
// already do is what counts as an answer — no CMS visit needed.
//
// The token is an HMAC of lead id + channel with PAYLOAD_SECRET, so a link
// can't be forged or reused for another lead. Links don't expire: an old
// alert tapped late still marks the lead answered (late, but honestly).

import { createHmac, timingSafeEqual } from 'node:crypto'

export const LEAD_REPLY_CHANNELS = ['whatsapp', 'call', 'email'] as const
export type LeadReplyChannel = (typeof LEAD_REPLY_CHANNELS)[number]

export function isLeadReplyChannel(value: unknown): value is LeadReplyChannel {
  return typeof value === 'string' && (LEAD_REPLY_CHANNELS as readonly string[]).includes(value)
}

function secret(): string {
  const value = process.env.PAYLOAD_SECRET
  if (!value) throw new Error('PAYLOAD_SECRET is not set — cannot sign lead reply links')
  return value
}

export function signLeadReply(leadId: string | number, via: LeadReplyChannel): string {
  return createHmac('sha256', secret()).update(`lead-reply:${leadId}:${via}`).digest('base64url').slice(0, 32)
}

export function verifyLeadReply(leadId: string | number, via: LeadReplyChannel, token: string): boolean {
  const expected = Buffer.from(signLeadReply(leadId, via))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function leadReplyUrl(serverURL: string, leadId: string | number, via: LeadReplyChannel): string {
  const params = new URLSearchParams({ lead: String(leadId), via, t: signLeadReply(leadId, via) })
  return `${serverURL}/api/leads/reply?${params.toString()}`
}

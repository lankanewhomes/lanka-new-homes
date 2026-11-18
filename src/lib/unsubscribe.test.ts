import { describe, expect, it } from 'vitest'
import { unsubscribeUrl, verifyUnsubscribe } from './unsubscribe'

describe('unsubscribe links', () => {
  process.env.PAYLOAD_SECRET = 'test-secret'
  it('verifies its own token, ignoring case and spaces', async () => {
    const url = new URL(await unsubscribeUrl(' Buyer@Example.com '))
    expect(url.pathname).toBe('/unsubscribe')
    expect(await verifyUnsubscribe(url.searchParams.get('e')!, url.searchParams.get('t')!)).toBe(true)
  })
  it('rejects a token for another email or a made-up token', async () => {
    const t = new URL(await unsubscribeUrl('a@b.com')).searchParams.get('t')!
    expect(await verifyUnsubscribe('c@d.com', t)).toBe(false)
    expect(await verifyUnsubscribe('a@b.com', 'x'.repeat(32))).toBe(false)
    expect(await verifyUnsubscribe('a@b.com', '')).toBe(false)
  })
})

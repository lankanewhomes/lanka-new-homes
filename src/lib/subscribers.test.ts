import { describe, expect, it } from 'vitest'
import { sendableRecipients } from './subscribers'

const rows = [
  { email: 'A@x.com', status: 'subscribed', interests: 'newsletter, news' },
  { email: 'b@x.com', status: 'contact_only', interests: '' },
  { email: 'c@x.com', status: 'unsubscribed', interests: 'newsletter' },
  { email: 'a@x.com', status: 'subscribed', interests: 'newsletter' },
  { email: 'd@x.com', status: 'subscribed', interests: 'listings' },
]
describe('sendableRecipients', () => {
  it('only subscribed people, once each', () => expect(sendableRecipients(rows).sort()).toEqual(['a@x.com', 'd@x.com']))
  it('never contact_only or unsubscribed', () => expect(sendableRecipients(rows)).not.toContain('b@x.com'))
  it('can be limited to one choice', () => expect(sendableRecipients(rows, 'listings')).toEqual(['d@x.com']))
})

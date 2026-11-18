import { describe, expect, it } from 'vitest'
import { senderHeader } from './sender-names'

describe('senderHeader', () => {
  it('names each LankaNewHomes address and quotes the name', () => {
    expect(senderHeader('no-reply@lankanewhomes.com')).toBe('"Notifications | LankaNewHomes" <no-reply@lankanewhomes.com>')
    expect(senderHeader('support@lankanewhomes.com')).toBe('"Support | LankaNewHomes" <support@lankanewhomes.com>')
    expect(senderHeader('developers@lankanewhomes.com')).toBe('"Developers | LankaNewHomes" <developers@lankanewhomes.com>')
    expect(senderHeader('rupan@lankanewhomes.com')).toBe('"Rupan Sinnarajah | LankaNewHomes" <rupan@lankanewhomes.com>')
  })
  it('replaces an old name on our own address and defaults to no-reply', () => {
    expect(senderHeader('LankaNewHomes <developers@lankanewhomes.com>')).toBe('"Developers | LankaNewHomes" <developers@lankanewhomes.com>')
    expect(senderHeader(undefined)).toBe('"Notifications | LankaNewHomes" <no-reply@lankanewhomes.com>')
  })
  it('leaves other addresses alone', () => {
    expect(senderHeader('a@b.com')).toBe('LankaNewHomes <a@b.com>')
    expect(senderHeader('Bob <bob@x.com>')).toBe('Bob <bob@x.com>')
  })
})

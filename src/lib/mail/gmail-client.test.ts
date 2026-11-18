import { describe, expect, it } from 'vitest'
import { parseAddressList } from './gmail-client'

describe('parseAddressList', () => {
  it('reads plain, named and quoted addresses', () => {
    expect(parseAddressList('a@b.com')).toEqual([{ email: 'a@b.com' }])
    expect(parseAddressList('Nimal Perera <nimal@x.lk>, "Doe, Jane" <jane@y.com>, c@d.com')).toEqual([
      { name: 'Nimal Perera', email: 'nimal@x.lk' },
      { name: 'Doe, Jane', email: 'jane@y.com' },
      { email: 'c@d.com' },
    ])
  })
  it('returns nothing for an empty header', () => {
    expect(parseAddressList(undefined)).toEqual([])
    expect(parseAddressList('')).toEqual([])
  })
})

describe('aliasesFor', () => {
  it('gives the three public addresses (minus the primary) only in live Google mode', async () => {
    const env = { ...process.env }
    process.env.MAIL_PROVIDER = 'google'; process.env.MAIL_MOCK_MODE = 'false'; process.env.GOOGLE_MAIL_SA_EMAIL = 'x@y'; process.env.GOOGLE_MAIL_SA_KEY = 'k'
    delete process.env.MAIL_ACCOUNT_SUPPORT; delete process.env.MAIL_ACCOUNT_DEVELOPERS; delete process.env.MAIL_ACCOUNT_NOREPLY; delete process.env.GOOGLE_MAIL_PRIMARY
    const { aliasesFor, configuredMailboxes } = await import('./index')
    expect(configuredMailboxes()).toEqual(['rupan@lankanewhomes.com'])
    expect(aliasesFor('rupan@lankanewhomes.com').sort()).toEqual(['developers@lankanewhomes.com', 'no-reply@lankanewhomes.com', 'support@lankanewhomes.com'])
    expect(aliasesFor('support@lankanewhomes.com')).toEqual([])
    process.env.MAIL_PROVIDER = ''
    expect(configuredMailboxes()).toHaveLength(3)
    Object.assign(process.env, env)
  })
})

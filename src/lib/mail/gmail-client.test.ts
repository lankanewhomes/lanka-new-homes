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

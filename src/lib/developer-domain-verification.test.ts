import { describe, expect, it } from 'vitest'
import { checkEmailAgainstWebsite, hashToken, newVerifyToken, websiteDomain } from './developer-domain-verification'

describe('developer domain verification', () => {
  it('extracts the website domain', () => {
    expect(websiteDomain('https://www.primelands.lk/about')).toBe('primelands.lk')
    expect(websiteDomain('')).toBeNull()
  })
  it('accepts own-domain and subdomain emails', () => {
    expect(checkEmailAgainstWebsite('Info@PrimeLands.lk', 'https://www.primelands.lk')).toEqual({ ok: true, domain: 'primelands.lk' })
    expect(checkEmailAgainstWebsite('a@mail.primelands.lk', 'primelands.lk').ok).toBe(true)
  })
  it('rejects free providers, other domains and lookalikes', () => {
    expect(checkEmailAgainstWebsite('x@gmail.com', 'primelands.lk').ok).toBe(false)
    expect(checkEmailAgainstWebsite('x@other.lk', 'primelands.lk').ok).toBe(false)
    expect(checkEmailAgainstWebsite('x@evilprimelands.lk', 'primelands.lk').ok).toBe(false)
    expect(checkEmailAgainstWebsite('x@primelands.lk', '').ok).toBe(false)
  })
  it('hashes tokens deterministically', () => {
    const { token, hash } = newVerifyToken()
    expect(hashToken(token)).toBe(hash)
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })
})

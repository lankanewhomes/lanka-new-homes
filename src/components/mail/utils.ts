import type { MailAddress } from './types'

export const nameOf = (a: MailAddress) => a.name?.trim() || a.email.split('@')[0] || a.email
export const label = (a: MailAddress) => (a.name?.trim() ? `${a.name.trim()} <${a.email}>` : a.email)

export function initials(a: MailAddress): string {
  const base = nameOf(a).replace(/[^\p{L}\p{N} ]/gu, ' ').trim()
  const parts = base.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

const PALETTE = ['#2563eb', '#16a34a', '#c2410c', '#7c3aed', '#0891b2', '#be185d', '#ca8a04', '#475569']
export function colorFor(text: string): string {
  let h = 0
  for (const c of text) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PALETTE[h % PALETTE.length]
}

export function listDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
  if (d.getFullYear() === now.getFullYear()) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

export function fullDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function parseAddresses(text: string): MailAddress[] {
  const out: MailAddress[] = []
  for (const part of text.split(/[,;\n]+/)) {
    const t = part.trim()
    if (!t) continue
    const m = t.match(/^(.*?)<([^>]+)>$/)
    out.push(m ? { name: m[1].replace(/^"|"$/g, '').trim() || undefined, email: m[2].trim() } : { email: t })
  }
  return out
}

export const isEmail = (s: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)

import type { MailAction } from './types'

// Thin fetch helpers for /api/mail/*. Every call goes to our own server (cookie auth); no provider tokens ever reach the browser.

export class MailApiError extends Error {}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...init, headers: { ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new MailApiError((body as { error?: string }).error ?? `Request failed (${res.status})`)
  return body as T
}

export const mailApi = {
  accounts: (refresh = false) => call<{ mock: boolean; pendingImport: boolean; warnings: string[]; accounts: import('./types').Account[] }>(`/api/mail/accounts${refresh ? '?refresh=1' : ''}`),
  messages: (params: Record<string, string | number | boolean | null | undefined>) => {
    const q = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && v !== false) q.set(k, v === true ? '1' : String(v))
    return call<{ messages: import('./types').MailMessage[]; hasMore: boolean }>(`/api/mail/messages?${q}`)
  },
  message: (id: number) => call<{ message: import('./types').MailMessage }>(`/api/mail/message/${id}`),
  act: (ids: number[], action: MailAction) => call<{ ok: true }>('/api/mail/messages', { method: 'PATCH', body: JSON.stringify({ ids, action }) }),
  remove: (ids: number[]) => call<{ ok: true }>('/api/mail/messages', { method: 'DELETE', body: JSON.stringify({ ids }) }),
  send: (payload: unknown) => call<{ ok: true }>('/api/mail/send', { method: 'POST', body: JSON.stringify(payload) }),
  saveDraft: (payload: unknown) => call<{ ok: true; draftId: number | null }>('/api/mail/save-draft', { method: 'POST', body: JSON.stringify(payload) }),
  sync: () => call<{ done: boolean }>('/api/mail/sync', { method: 'POST' }),
  importBatch: (account?: string) => call<{ done: boolean; warnings: string[]; accounts: { email: string; error?: string }[] }>(`/api/mail/import${account ? `?account=${encodeURIComponent(account)}` : ''}`, { method: 'POST' }),
  status: (test = false) => call<StatusResponse>(`/api/mail/status${test ? '?test=1' : ''}`),
  contact: (email: string) => call<{ matches: { kind: string; label: string; href: string }[] }>(`/api/mail/contact?email=${encodeURIComponent(email)}`),
  attachmentUrl: (messageId: number, attachmentId: string, inline = false) => `/api/mail/attachment?messageId=${messageId}&attachmentId=${encodeURIComponent(attachmentId)}${inline ? '&inline=1' : ''}`,
}

export type StatusResponse = {
  mock: boolean
  credentialsPresent: boolean
  env: { key: string; set: boolean }[]
  connection: { ok: boolean; message: string; accounts: { email: string; zohoAccountId: string }[] } | null
  sync: { accounts: { id: number; email: string; zohoAccountId: string; imported: number; total: number; foldersComplete: number; foldersTotal: number; lastSyncedAt: string | null; lastError: string | null; running: boolean }[] }
}

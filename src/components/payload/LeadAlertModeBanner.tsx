'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Red strip at the top of the /cms dashboard while lead alerts are in Test
// mode (Lead alert settings), so nobody forgets to switch them back on.
// The global is admin-only to read, so developers get a 403 and see nothing.
export function LeadAlertModeBanner() {
  const [state, setState] = useState<{ mode: string; testInbox: string | null } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/payload-api/globals/lead-alert-settings?depth=0', { credentials: 'include', signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return
        const body = (await res.json()) as { mode?: string; testInbox?: string | null }
        setState({ mode: body.mode ?? 'live', testInbox: body.testInbox ?? null })
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  if (!state || state.mode !== 'test') return null

  return (
    <div role="status" style={{ margin: '0 32px 20px', padding: '10px 14px', borderRadius: 6, background: 'var(--theme-error-500)', color: '#fff', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <strong>Lead alerts are in TEST mode.</strong>
      <span>Developers are not being emailed — every alert goes to {state.testInbox || 'the test inbox'}.</span>
      <Link href="/cms/globals/lead-alert-settings" style={{ color: '#fff', fontWeight: 700, textDecoration: 'underline', marginLeft: 'auto' }}>
        Switch back to Live
      </Link>
    </div>
  )
}

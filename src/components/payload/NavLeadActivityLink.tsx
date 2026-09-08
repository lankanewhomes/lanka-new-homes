import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

// Registered via payload.config.ts admin.components.afterNavLinks — entry
// point for the admin-only "Lead activity" page (/cms/lead-activity):
// who was alerted, who answered, how fast.
export function NavLeadActivityLink({ user }: AdminViewServerProps) {
  if ((user as { role?: string } | null)?.role !== 'admin') return null

  return (
    <div style={{ padding: '4px 20px 8px' }}>
      <Link
        href="/cms/lead-activity"
        style={{
          display: 'block',
          padding: '10px 14px',
          borderRadius: 6,
          border: '1px solid #1d1d22',
          background: 'rgba(29, 29, 34, 0.06)',
          color: 'inherit',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        ⚡ Lead activity
      </Link>
    </div>
  )
}

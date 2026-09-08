import Link from 'next/link'
import type { AdminViewServerProps } from 'payload'

// Registered via payload.config.ts admin.components.afterNavLinks — the
// entry point for "Import from your website" (/cms/import). Shown to
// developers and admins; other roles have nothing to import.
export function NavImportLink({ user }: AdminViewServerProps) {
  const role = (user as { role?: string } | null)?.role
  if (role !== 'developer' && role !== 'admin') return null

  return (
    <div style={{ padding: '4px 20px 8px' }}>
      <Link
        href="/cms/import"
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
        ⬆ Import a project from your website
      </Link>
    </div>
  )
}

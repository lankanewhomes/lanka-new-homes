import { businessProfileExtraFields, directoryCollection } from './shared-fields'
import { syncArchitectToSupabase } from './hooks/sync-to-supabase'

// Selectable by developers on their Projects (see Projects.ts's `architect`
// relationship) — record creation/editing stays admin-only per the
// access-control spec.
export const Architects = directoryCollection(
  'architects',
  [{ name: 'portfolio_link', type: 'text', label: 'Portfolio Link' }, ...businessProfileExtraFields()],
  [syncArchitectToSupabase],
)

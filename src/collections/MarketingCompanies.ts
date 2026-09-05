import { businessProfileExtraFields, directoryCollection } from './shared-fields'
import { syncMarketingCompanyToSupabase } from './hooks/sync-to-supabase'

// Selectable by developers on their Projects (see Projects.ts's
// `marketing_company` relationship) — record creation/editing stays
// admin-only per the access-control spec.
export const MarketingCompanies = directoryCollection(
  'marketing-companies',
  [{ name: 'services', type: 'text', hasMany: true }, ...businessProfileExtraFields()],
  [syncMarketingCompanyToSupabase],
)

import { businessProfileExtraFields, directoryCollection } from './shared-fields'
import { syncSalesCompanyDeleteToSupabase, syncSalesCompanyToSupabase } from './hooks/sync-to-supabase'

// Selectable by developers on their Projects (see Projects.ts's
// `sales_company` relationship) — record creation/editing stays admin-only
// per the access-control spec.
export const SalesCompanies = directoryCollection(
  'sales-companies',
  [{ name: 'services', type: 'text', hasMany: true }, ...businessProfileExtraFields()],
  [syncSalesCompanyToSupabase],
  [syncSalesCompanyDeleteToSupabase],
)

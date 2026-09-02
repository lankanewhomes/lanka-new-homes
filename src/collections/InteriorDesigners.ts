import { directoryCollection } from './shared-fields'

// Selectable by developers on their Projects (see Projects.ts's
// `interior_designer` relationship) — record creation/editing stays
// admin-only per the access-control spec, same as Architects/Marketing/Sales.
export const InteriorDesigners = directoryCollection('interior-designers', [
  { name: 'portfolio_link', type: 'text', label: 'Portfolio Link' },
])

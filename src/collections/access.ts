import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

// req.user's shape isn't known until `payload generate:types` runs against
// this config, so it's narrowed manually here instead of importing the
// (not-yet-generated) payload-types.ts.
type AuthedUser = {
  id: string | number
  role?: 'buyer' | 'developer' | 'construction_company' | 'admin'
}

function authedUser(req: PayloadRequest): AuthedUser | null {
  return (req.user as AuthedUser | null) ?? null
}

export function isAdmin(req: PayloadRequest): boolean {
  return authedUser(req)?.role === 'admin'
}

export function getRole(req: PayloadRequest): AuthedUser['role'] | undefined {
  return authedUser(req)?.role
}

export const adminOnly: Access = ({ req }) => isAdmin(req)

export const adminOnlyField: FieldAccess = ({ req }) => isAdmin(req)

export const publicRead: Access = () => true

export const authenticatedCreate: Access = ({ req }) => Boolean(req.user)

// Owner-or-admin: used by collections with a top-level `user` relationship
// (Saved Listings, Leads) that only the owning user (or an admin) may touch.
export const adminOrSelfById: Access = ({ req }) => {
  if (isAdmin(req)) return true
  const user = authedUser(req)
  if (!user) return false
  return { id: { equals: user.id } }
}

export const ownerOrAdmin: Access = ({ req }) => {
  if (isAdmin(req)) return true
  const user = authedUser(req)
  if (!user) return false
  return { user: { equals: user.id } }
}

// Project ids belonging to the current developer-role user's own company —
// shared by every access rule below that scopes a collection down to "my
// own projects" (Leads, Analytics).
export async function getOwnedProjectIds(req: PayloadRequest): Promise<(string | number)[]> {
  if (getRole(req) !== 'developer') return []
  const ownedDeveloperIds = await getOwnedDeveloperIds(req)
  if (ownedDeveloperIds.length === 0) return []
  const ownedProjects = await req.payload.find({
    collection: 'projects',
    where: { developer: { in: ownedDeveloperIds } },
    limit: 1000,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return ownedProjects.docs.map((doc) => doc.id)
}

// Leads read/update: the submitting buyer (if they had an account), an
// admin, or the developer whose project the lead is about — a builder needs
// to see and update the status of inquiries on their own projects, even
// though they're not the `user` who submitted the lead.
export const leadOwnerOrDeveloperOrAdmin: Access = async ({ req }) => {
  if (isAdmin(req)) return true
  const user = authedUser(req)
  if (!user) return false

  const projectIds = await getOwnedProjectIds(req)
  if (projectIds.length > 0) {
    const where: Where = { or: [{ user: { equals: user.id } }, { project: { in: projectIds } }] }
    return where
  }

  return { user: { equals: user.id } }
}

// Analytics events: admin sees everything; a developer sees only events
// logged against their own projects (so they can filter/query raw traffic
// for their own listings in /cms) — never other builders' data.
export const analyticsOwnerOrAdmin: Access = async ({ req }) => {
  if (isAdmin(req)) return true
  const projectIds = await getOwnedProjectIds(req)
  if (projectIds.length === 0) return false
  const where: Where = { project: { in: projectIds } }
  return where
}

// Company-profile ids owned by the current user (that collection's `user`
// field points at them) — a user can own more than one profile in
// principle, so this returns every id they own.
export async function getOwnedCompanyIds(
  req: PayloadRequest,
  collection: 'developers' | 'construction-companies',
): Promise<(string | number)[]> {
  const user = authedUser(req)
  if (!user) return []
  const result = await req.payload.find({
    collection,
    where: { user: { equals: user.id } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
    req,
  })
  return result.docs.map((doc) => doc.id)
}

export async function getOwnedDeveloperIds(req: PayloadRequest): Promise<(string | number)[]> {
  return getOwnedCompanyIds(req, 'developers')
}

// The collection a "payer" role owns a company profile in — developer ->
// Developers, construction_company -> Construction Companies (builders).
function payerCollectionForRole(role: ReturnType<typeof getRole>): 'developers' | 'construction-companies' | null {
  if (role === 'developer') return 'developers'
  if (role === 'construction_company') return 'construction-companies'
  return null
}

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return (value as { id: string | number }).id
  }
  return value as string | number | undefined
}

// Projects (and Hero Slide requests): admins can touch everything; a
// developer can only touch projects/slides whose `developer`/`advertiser`
// relationship points at a company profile they own.
export function ownDeveloperAccess(relationField: string): Access {
  return async ({ req, data }) => {
    if (isAdmin(req)) return true
    if (getRole(req) !== 'developer') return false
    const ownedIds = await getOwnedDeveloperIds(req)
    if (ownedIds.length === 0) return false

    // Create: no existing document to scope a Where against yet, so check
    // the relationship value being submitted directly.
    if (data) {
      const targetId = relatedId(data[relationField])
      return ownedIds.some((id) => String(id) === String(targetId))
    }

    return { [relationField]: { in: ownedIds } }
  }
}

// Same idea as ownDeveloperAccess, but for a *polymorphic* relationship
// field (relationTo: ['developers', 'construction-companies']) that either
// a developer or a construction_company (builder) can own — used by
// Payments' `payer` field.
export function ownPayerAccess(relationField: string): Access {
  return async ({ req, data }) => {
    if (isAdmin(req)) return true
    const collection = payerCollectionForRole(getRole(req))
    if (!collection) return false
    const ownedIds = await getOwnedCompanyIds(req, collection)
    if (ownedIds.length === 0) return false

    if (data) {
      const value = data[relationField] as { relationTo?: string; value?: unknown } | undefined
      if (!value || value.relationTo !== collection) return false
      const targetId = relatedId(value.value)
      return ownedIds.some((id) => String(id) === String(targetId))
    }

    return {
      and: [{ [`${relationField}.relationTo`]: { equals: collection } }, { [`${relationField}.value`]: { in: ownedIds } }],
    }
  }
}

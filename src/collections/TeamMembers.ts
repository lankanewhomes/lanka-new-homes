/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionConfig } from 'payload'
import type { Access, Where } from 'payload'
import { getOwnedCompanyIds, getOwnedDeveloperIds, getRole, isAdmin, ownPayerAccess } from './access'
import { normEmail, sendTeamInviteEmail } from '@/lib/team-invites'

// Staff of a Developer or Construction Company. The company's main login adds a team member by typing their email and ticking the
// listings they handle (owner decision 2026-10-14, details in src/lib/team-invites.ts). The row starts as "Invited" and becomes
// "Active" once that person has an account with the email confirmed. Access rules for team members live in access.ts
// (getTeamProjectIds / withTeamListings); enquiry copies in lead-alerts.ts. Reuses ownPayerAccess (does the requester own the
// `company` this row points at), so a team member cannot manage the team.
// read / update / delete: an owner reaches only the rows of the company they own. This returns a Where (not a yes/no from the
// submitted data like ownPayerAccess) because Payload checks permissions for the empty create form too, where there is no company
// yet: a data-based "no" there made the Add team member screen answer "Nothing found".
const ownTeamRows: Access = async ({ req }) => {
  if (isAdmin(req)) return true
  const role = getRole(req)
  const collection = role === 'developer' ? 'developers' : role === 'construction_company' ? 'construction-companies' : null
  if (!collection) return false
  const ids = await getOwnedCompanyIds(req, collection)
  if (ids.length === 0) return false
  const where: Where = { and: [{ 'company.relationTo': { equals: collection } }, { 'company.value': { in: ids } }] }
  return where
}

// Create: the owner leaves `company` blank (the beforeChange hook fills in their own), so with no company submitted it is enough
// to own a developer profile; when one is submitted it must be theirs (ownPayerAccess).
const createTeamMember: Access = async (args) => {
  if (isAdmin(args.req)) return true
  // The create form starts with an empty company ({ relationTo, value: null }): that counts as "not chosen".
  const company = (args.data as { company?: { value?: unknown } | null } | undefined)?.company
  if (!company || company.value === null || company.value === undefined) return args.req.user ? (await getOwnedDeveloperIds(args.req)).length > 0 : false
  return ownPayerAccess('company')(args)
}

export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: 'Team member', plural: 'Team members' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'listings', 'lands', 'status', 'role'],
    group: 'Users & Team',
    description: 'People who help manage some of your listings. Add their email and tick the listings they handle. They get an email invite, confirm their email address, and can then edit those listings and see only the enquiries about them. You keep full control of everything.',
  },
  access: {
    read: ownTeamRows,
    create: createTeamMember,
    update: ownTeamRows,
    delete: ownTeamRows,
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const next: any = { ...data }
        if (typeof next.email === 'string') next.email = normEmail(next.email)
        const admin = isAdmin(req)

        // A company owner adding someone does not pick the company: it is theirs.
        if (operation === 'create' && !(next.company && next.company.value) && !admin) {
          const [ownedId] = await getOwnedDeveloperIds(req)
          if (ownedId) next.company = { relationTo: 'developers', value: ownedId }
        }

        // Listings must belong to this company, and the owner cannot hand over someone else's.
        const company = next.company ?? originalDoc?.company
        const listings: any[] = next.listings ?? originalDoc?.listings ?? []
        if (!admin && listings.length) {
          if (!company || company.relationTo !== 'developers') throw new Error('Team members can be given listings only on a developer profile.')
          const ids = listings.map((l) => (l && typeof l === 'object' ? l.id : l))
          const found = await req.payload.find({ collection: 'projects', where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true, req })
          const companyId = typeof company.value === 'object' ? company.value.id : company.value
          if (found.docs.some((p: any) => String(typeof p.developer === 'object' ? p.developer?.id : p.developer) !== String(companyId))) {
            throw new Error('You can only give a team member listings that belong to your company.')
          }
        }

        // Same rule for lands: the seller must be this company.
        const landIds: any[] = (next.lands ?? originalDoc?.lands ?? []).map((l: any) => (l && typeof l === 'object' ? l.id : l))
        if (!admin && landIds.length) {
          if (!company || company.relationTo !== 'developers') throw new Error('Team members can be given lands only on a developer profile.')
          const companyId = typeof company.value === 'object' ? company.value.id : company.value
          const found = await req.payload.find({ collection: 'lands', where: { id: { in: landIds } }, limit: landIds.length, depth: 0, overrideAccess: true, req })
          if (found.docs.length !== landIds.length || found.docs.some((l: any) => l.seller?.relationTo !== 'developers' || String(typeof l.seller?.value === 'object' ? l.seller.value?.id : l.seller?.value) !== String(companyId))) {
            throw new Error('You can only give a team member land listings that belong to your company.')
          }
        }

        const email = normEmail(next.email ?? originalDoc?.email)
        if (!email) throw new Error('Enter the team member’s email address.')
        // Once linked the person stays linked; the email cannot be swapped for someone else's afterwards.
        if (originalDoc?.user && next.email && normEmail(originalDoc.email) !== next.email) {
          throw new Error('This team member is already linked to an account. Remove them and add the new email instead.')
        }
        if (!next.user && !originalDoc?.user) next.status = 'invited'
        return next
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        try {
          // Linking happens when that person next signs in (Users afterLogin), which is only possible once the email is confirmed.
          // Nobody is switched into the team just because an owner typed their address.
          if (operation === 'create') {
            const accounts = await req.payload.find({ collection: 'users', where: { email: { equals: doc.email } }, limit: 1, depth: 0, overrideAccess: true, req })
            const account = accounts.docs[0] as any
            const company = typeof doc.company?.value === 'object' ? doc.company.value : await req.payload.findByID({ collection: doc.company.relationTo, id: doc.company.value, depth: 0, overrideAccess: true, req }).catch(() => null)
            const ids = (doc.listings ?? []).map((l: any) => (l && typeof l === 'object' ? l.id : l))
            const landIds = (doc.lands ?? []).map((l: any) => (l && typeof l === 'object' ? l.id : l))
            const names = [
              ...(ids.length ? (await req.payload.find({ collection: 'projects', where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true, req })).docs.map((p: any) => p.name) : []),
              ...(landIds.length ? (await req.payload.find({ collection: 'lands', where: { id: { in: landIds } }, limit: landIds.length, depth: 0, overrideAccess: true, req })).docs.map((l: any) => l.title) : []),
            ]
            await sendTeamInviteEmail({ to: doc.email, companyName: (company as any)?.name || 'A company', listingNames: names, accountExists: Boolean(account?._verified) })
          }
        } catch (error) {
          req.payload.logger.error(`Team member invite failed: ${error instanceof Error ? error.message : error}`)
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'email', type: 'email', required: true, index: true, label: 'Team member email', admin: { description: 'They sign in with this exact address. They must confirm it before anything is shared.' } },
    { name: 'listings', type: 'relationship', relationTo: 'projects', hasMany: true, label: 'Listings they handle', admin: { description: 'They can edit and delete only these, and see only the enquiries about them. Their email is also copied on every enquiry for these listings.' } },
    { name: 'lands', type: 'relationship', relationTo: 'lands', hasMany: true, label: 'Land listings they handle', admin: { description: 'Same as above, for land listings.' } },
    {
      name: 'company',
      type: 'relationship',
      relationTo: ['developers', 'construction-companies'],
      required: true,
      index: true,
      // Owners never pick this: their own company is filled in when they save. Only an admin sees (and can change) it.
      admin: { description: 'Filled in automatically with your company.', condition: (_data, _siblingData, { user }) => (user as { role?: string } | null)?.role === 'admin' },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, access: { create: ({ req }) => isAdmin(req), update: ({ req }) => isAdmin(req) }, admin: { readOnly: true, description: 'Set automatically once they have an account with the email confirmed.', condition: (_data, _siblingData, { user }) => (user as { role?: string } | null)?.role === 'admin' } },
    { name: 'status', type: 'select', defaultValue: 'invited', options: [{ label: 'Invited', value: 'invited' }, { label: 'Active', value: 'active' }], access: { create: ({ req }) => isAdmin(req), update: ({ req }) => isAdmin(req) }, admin: { readOnly: true, components: { Cell: '@/components/payload/ListingCells#StatusCell' } } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: ['owner', 'sales', 'marketing', 'member'],
      admin: { description: 'A label only. What they can do is set by the listings you tick.', condition: (_data, _siblingData, { user }) => (user as { role?: string } | null)?.role === 'admin', components: { Cell: '@/components/payload/ListingCells#StatusCell' } },
    },
  ],
}

/* eslint-disable @typescript-eslint/no-explicit-any -- Payload docs are loosely typed here */
import type { CollectionConfig } from 'payload'
import { getOwnedDeveloperIds, isAdmin, ownPayerAccess } from './access'
import { normEmail, sendTeamInviteEmail } from '@/lib/team-invites'

// Staff of a Developer or Construction Company. The company's main login adds a team member by typing their email and ticking the
// listings they handle (owner decision 2026-10-14, details in src/lib/team-invites.ts). The row starts as "Invited" and becomes
// "Active" once that person has an account with the email confirmed. Access rules for team members live in access.ts
// (getTeamProjectIds / withTeamListings); enquiry copies in lead-alerts.ts. Reuses ownPayerAccess (does the requester own the
// `company` this row points at), so a team member cannot manage the team.
export const TeamMembers: CollectionConfig = {
  slug: 'team-members',
  labels: { singular: 'Team member', plural: 'Team members' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'listings', 'status', 'role'],
    group: 'Users & Team',
    description: 'People who help manage some of your listings. Add their email and tick the listings they handle. They get an email invite, confirm their email address, and can then edit those listings and see only the enquiries about them. You keep full control of everything.',
  },
  access: {
    read: ownPayerAccess('company'),
    create: ownPayerAccess('company'),
    update: ownPayerAccess('company'),
    delete: ownPayerAccess('company'),
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        const next: any = { ...data }
        if (typeof next.email === 'string') next.email = normEmail(next.email)
        const admin = isAdmin(req)

        // A company owner adding someone does not pick the company: it is theirs.
        if (operation === 'create' && !next.company && !admin) {
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
            const names = ids.length ? (await req.payload.find({ collection: 'projects', where: { id: { in: ids } }, limit: ids.length, depth: 0, overrideAccess: true, req })).docs.map((p: any) => p.name) : []
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
    {
      name: 'company',
      type: 'relationship',
      relationTo: ['developers', 'construction-companies'],
      required: true,
      index: true,
      admin: { description: 'Filled in automatically with your company.' },
    },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true, access: { create: ({ req }) => isAdmin(req), update: ({ req }) => isAdmin(req) }, admin: { readOnly: true, description: 'Set automatically once they have an account with the email confirmed.' } },
    { name: 'status', type: 'select', defaultValue: 'invited', options: [{ label: 'Invited', value: 'invited' }, { label: 'Active', value: 'active' }], access: { create: ({ req }) => isAdmin(req), update: ({ req }) => isAdmin(req) }, admin: { readOnly: true, components: { Cell: '@/components/payload/ListingCells#StatusCell' } } },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: ['owner', 'sales', 'marketing', 'member'],
      admin: { description: 'A label only. What they can do is set by the listings you tick.', components: { Cell: '@/components/payload/ListingCells#StatusCell' } },
    },
  ],
}

import { describe, expect, it } from 'vitest'
import type { Access, PayloadRequest } from 'payload'
import { getOwnedProjectIds, getTeamProjectIds, withTeamListings } from './access'

// Fake request: `payload.find` answers from small in-memory tables, enough to exercise the team-member rules.
function req(user: { id: number; role: string } | null, tables: { developers?: any[]; projects?: any[]; 'team-members'?: any[] }): PayloadRequest { // eslint-disable-line @typescript-eslint/no-explicit-any
  return {
    user,
    payload: {
      find: async ({ collection, where }: { collection: keyof typeof tables; where: any }) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        const rows = tables[collection] ?? []
        if (collection === 'developers') return { docs: rows.filter((d) => d.user === where.user.equals) }
        if (collection === 'projects') return { docs: rows.filter((p) => where.developer.in.includes(p.developer)) }
        if (collection === 'team-members') return { docs: rows.filter((t) => t.user === where.user.equals) }
        return { docs: [] }
      },
    },
  } as unknown as PayloadRequest
}

const projects = [{ id: 1, developer: 10 }, { id: 2, developer: 10 }, { id: 3, developer: 11 }]
const developers = [{ id: 10, user: 100 }, { id: 11, user: 101 }]

describe('team member listing access', () => {
  it('a team member gets exactly the listings ticked for them', async () => {
    const r = req({ id: 200, role: 'developer' }, { developers, projects, 'team-members': [{ user: 200, listings: [1] }] })
    expect(await getTeamProjectIds(r)).toEqual([1])
    expect(await getOwnedProjectIds(r)).toEqual([1]) // enquiries and analytics follow the same list
  })

  it('the owner keeps every listing of the company and sees nothing of another company', async () => {
    const r = req({ id: 100, role: 'developer' }, { developers, projects, 'team-members': [] })
    expect((await getOwnedProjectIds(r)).sort()).toEqual([1, 2])
  })

  it('an owner who is also a team member elsewhere gets both sets', async () => {
    const r = req({ id: 100, role: 'developer' }, { developers, projects, 'team-members': [{ user: 100, listings: [{ id: 3 }] }] })
    expect((await getOwnedProjectIds(r)).sort()).toEqual([1, 2, 3])
  })

  it('buyers and anonymous visitors never get team listings', async () => {
    const t = { 'team-members': [{ user: 200, listings: [1] }] }
    expect(await getTeamProjectIds(req({ id: 200, role: 'buyer' }, t))).toEqual([])
    expect(await getTeamProjectIds(req(null, t))).toEqual([])
  })

  it('withTeamListings adds the assigned listings to what the base rule allows, and never to create', async () => {
    const base: Access = async () => false
    const r = req({ id: 200, role: 'developer' }, { developers, projects, 'team-members': [{ user: 200, listings: [1] }] })
    expect(await withTeamListings(base)({ req: r } as never)).toEqual({ id: { in: [1] } })

    const owner: Access = async () => ({ developer: { in: [10] } })
    expect(await withTeamListings(owner)({ req: r } as never)).toEqual({ or: [{ developer: { in: [10] } }, { id: { in: [1] } }] })

    const admin: Access = async () => true
    expect(await withTeamListings(admin)({ req: r } as never)).toBe(true)

    const nobody = req({ id: 300, role: 'developer' }, { developers, projects, 'team-members': [] })
    expect(await withTeamListings(base)({ req: nobody } as never)).toBe(false)
  })
})

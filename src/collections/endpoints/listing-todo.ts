import type { Endpoint } from 'payload'
import { getOwnedDeveloperIds, isAdmin } from '../access'
import { computeCompleteness, RANKING_POINTS_PER_ITEM, SCORE_POINTS_PER_ITEM } from '@/lib/completeness'

export type ListingTodoRow = {
  id: string | number
  name: string
  slug: string
  isPublished: boolean
  score: number
  missing: { key: string; label: string; hint: string }[]
}

export type ListingTodoResponse = {
  projects: ListingTodoRow[]
  rankingPointsPerItem: number
  scorePointsPerItem: number
}

// GET /payload-api/listing-todo — every project the signed-in developer owns
// (all projects for an admin) with its completeness score and the checks it
// still fails, least complete first. Read by ListingTodoPanel on the /cms
// dashboard. Scoped server-side: the public REST `find` on projects would
// return everyone's listings.
export const listingTodoEndpoint: Endpoint = {
  path: '/listing-todo',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = isAdmin(req)
    const ownedIds = admin ? [] : await getOwnedDeveloperIds(req)
    if (!admin && ownedIds.length === 0) {
      return Response.json({ projects: [], rankingPointsPerItem: RANKING_POINTS_PER_ITEM, scorePointsPerItem: SCORE_POINTS_PER_ITEM } satisfies ListingTodoResponse)
    }

    const { docs } = await req.payload.find({
      collection: 'projects',
      where: admin ? {} : { developer: { in: ownedIds } },
      limit: 200,
      depth: 0,
      overrideAccess: true,
      req,
    })

    const projects: ListingTodoRow[] = docs
      .map((doc) => {
        const { score, missing } = computeCompleteness(doc as never)
        return {
          id: doc.id,
          name: String(doc.name ?? ''),
          slug: String(doc.slug ?? ''),
          isPublished: doc.isPublished !== false,
          score,
          missing: missing.map(({ key, label, hint }) => ({ key, label, hint })),
        }
      })
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))

    return Response.json({ projects, rankingPointsPerItem: RANKING_POINTS_PER_ITEM, scorePointsPerItem: SCORE_POINTS_PER_ITEM } satisfies ListingTodoResponse)
  },
}

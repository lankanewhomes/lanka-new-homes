import type { Endpoint } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { isAdmin } from '../access'
import { postCustom } from '@/lib/social/post-custom'

// POST /payload-api/social-post-custom { projectId, slug, instagram?: { caption, images[] }, facebook?: { caption, images[] } }
// Admin only. Used by the dashboard's "Create a post" page ("Post now"). Dry run until Meta is connected (see src/lib/social/post-custom.ts).
export const socialPostCustomEndpoint: Endpoint = {
  path: '/social-post-custom',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    if (!isAdmin(req)) return Response.json({ error: 'Admins only' }, { status: 403 })
    await addDataAndFileToRequest(req)
    const b = (req.data ?? {}) as { projectId?: string | number; slug?: string; instagram?: { caption: string; images: string[] }; facebook?: { caption: string; images: string[] } }
    if (!b.projectId || !b.slug || (!b.instagram && !b.facebook)) return Response.json({ error: 'projectId, slug and at least one platform are required' }, { status: 400 })
    const actor = (req.user as { email?: string }).email ?? 'dashboard'
    try {
      return Response.json(await postCustom(req.payload, { projectId: b.projectId, slug: b.slug, instagram: b.instagram, facebook: b.facebook }, actor))
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 })
    }
  },
}

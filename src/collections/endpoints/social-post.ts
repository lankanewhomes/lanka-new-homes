import type { Endpoint, PayloadRequest } from 'payload'
import { addDataAndFileToRequest } from 'payload'
import { getOwnedDeveloperIds, isAdmin } from '../access'
import { isMetaConfigured } from '@/lib/social/meta'
import { finishInstagramPost, listSocialPosts, loadSocialContext, publishProjectSocial, type Kind, type Platform } from '@/lib/social/publish'

// GET  /payload-api/social-post?projectId=  → assets + caption preview + post log (Social tab load)
// POST /payload-api/social-post { action: 'post', projectId, platforms?, kinds? }   → publish now
// POST /payload-api/social-post { action: 'finish', socialPostId }                  → publish a processing IG container
// Admins, or the developer who owns the project.

async function canManage(req: PayloadRequest, projectId: string | number): Promise<boolean> {
  if (isAdmin(req)) return true
  const project = await req.payload.findByID({ collection: 'projects', id: projectId, depth: 0, overrideAccess: true }).catch(() => null)
  if (!project) return false
  const dev = typeof project.developer === 'object' && project.developer ? (project.developer as { id: string | number }).id : project.developer
  const owned = await getOwnedDeveloperIds(req)
  return owned.some((id) => String(id) === String(dev))
}

export const socialStatusEndpoint: Endpoint = {
  path: '/social-post',
  method: 'get',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    const projectId = req.query?.projectId as string | undefined
    if (!projectId) return Response.json({ error: 'projectId is required' }, { status: 400 })
    if (!(await canManage(req, projectId))) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const { project, assets, caption } = await loadSocialContext(req.payload, projectId)
    const posts = await listSocialPosts(req.payload, projectId)
    return Response.json({ configured: isMetaConfigured(), slug: project.slug, assets, caption, posts })
  },
}

export const socialPostEndpoint: Endpoint = {
  path: '/social-post',
  method: 'post',
  handler: async (req) => {
    if (!req.user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
    await addDataAndFileToRequest(req)
    const body = (req.data ?? {}) as { action?: string; projectId?: string | number; socialPostId?: string | number; platforms?: Platform[]; kinds?: Kind[] }
    const actor = (req.user as { email?: string }).email ?? 'manual'

    if (body.action === 'finish') {
      if (!body.socialPostId) return Response.json({ error: 'socialPostId is required' }, { status: 400 })
      const post = await req.payload.findByID({ collection: 'social-posts', id: body.socialPostId, depth: 0, overrideAccess: true }).catch(() => null)
      if (!post) return Response.json({ error: 'Not found' }, { status: 404 })
      const projectId = typeof post.project === 'object' && post.project ? (post.project as { id: string | number }).id : (post.project as string | number)
      if (!(await canManage(req, projectId))) return Response.json({ error: 'Forbidden' }, { status: 403 })
      return Response.json({ post: await finishInstagramPost(req.payload, body.socialPostId) })
    }

    if (!body.projectId) return Response.json({ error: 'projectId is required' }, { status: 400 })
    if (!(await canManage(req, body.projectId))) return Response.json({ error: 'Forbidden' }, { status: 403 })
    const platforms = (body.platforms ?? ['facebook', 'instagram']).filter((p): p is Platform => p === 'facebook' || p === 'instagram')
    const kinds = (body.kinds ?? ['carousel', 'reel']).filter((k): k is Kind => k === 'carousel' || k === 'reel')
    if (!platforms.length || !kinds.length) return Response.json({ error: 'Pick at least one platform and one format.' }, { status: 400 })
    try {
      const result = await publishProjectSocial(req.payload, body.projectId, { platforms, kinds }, actor)
      return Response.json(result)
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : String(error) }, { status: 422 })
    }
  },
}

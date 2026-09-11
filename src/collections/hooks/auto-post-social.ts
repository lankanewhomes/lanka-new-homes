import type { CollectionAfterChangeHook } from 'payload'
import { isMetaConfigured } from '@/lib/social/meta'
import { publishProjectSocial } from '@/lib/social/publish'

// "Post to Facebook & Instagram when this listing goes live" (Social tab
// toggle). Fires once, on the save that flips isPublished false → true, and
// only when Meta is actually connected — a dry run would just clutter the
// log. Best-effort: a Meta failure is logged as a failed SocialPosts row and
// never blocks the save.
export const autoPostSocialAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update') return doc
  const social = doc.social as { autoPost?: boolean | null } | undefined
  if (!social?.autoPost || !doc.isPublished || previousDoc?.isPublished) return doc
  if (!isMetaConfigured()) return doc
  try {
    await publishProjectSocial(req.payload, doc.id, {}, 'auto-post')
  } catch (error) {
    req.payload.logger.error({ err: error, project: doc.slug }, 'auto-post to social failed')
  }
  return doc
}

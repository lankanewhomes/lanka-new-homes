import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import type { Payload, PayloadRequest } from 'payload'

// Mints a real Payload session cookie by hand (using Payload's own
// jwtSign/getFieldsToSign/generatePayloadCookie — the same primitives its
// built-in login endpoint uses), for flows with no password to authenticate
// against (magic link, Google OAuth). The resulting cookie is
// indistinguishable from a normal login, so no separate auth strategy is
// needed for it to work. Caller must already have checked `_verified`.
export async function mintPayloadSessionCookie(payload: Payload, user: { id: string | number; email: string; sessions?: unknown }, req?: PayloadRequest): Promise<string> {
  const collection = payload.collections.users

  // auth.useSessions defaults to true in Payload 3.x — the JWT strategy
  // requires a matching session (sid) on the user doc, or it treats the
  // token as invalid. Mirrors Payload's own addSessionToUser (not exported
  // from the package) since a plain JWT isn't enough on its own.
  let sid: string | undefined
  if (collection.config.auth.useSessions) {
    sid = crypto.randomUUID()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + collection.config.auth.tokenExpiration * 1000)
    const existingSessions = (Array.isArray(user.sessions)
      ? (user.sessions as { id: string; expiresAt: string }[])
      : []
    ).filter((s) => new Date(s.expiresAt) > now)
    await payload.update({
      collection: 'users',
      id: user.id,
      data: { sessions: [...existingSessions, { id: sid, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() }] },
      overrideAccess: true,
      req,
    })
  }

  const signableUser = { ...user, collection: 'users' } as PayloadRequest['user']
  const fieldsToSign = getFieldsToSign({ collectionConfig: collection.config, email: user.email, sid, user: signableUser })
  const { token: jwt } = await jwtSign({
    fieldsToSign,
    secret: payload.secret,
    tokenExpiration: collection.config.auth.tokenExpiration,
  })
  return generatePayloadCookie({
    collectionAuthConfig: collection.config.auth,
    cookiePrefix: payload.config.cookiePrefix,
    token: jwt,
  })
}

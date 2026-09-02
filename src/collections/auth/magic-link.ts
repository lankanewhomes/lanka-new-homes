import { createHmac, timingSafeEqual } from 'node:crypto'
import { getFieldsToSign, jwtSign } from 'payload'
import { generatePayloadCookie } from 'payload/shared'
import type { Endpoint, PayloadRequest } from 'payload'

const MAGIC_LINK_TTL_MS = 15 * 60 * 1000

function sign(email: string, expires: number, secret: string): string {
  return createHmac('sha256', secret).update(`${email}:${expires}`).digest('hex')
}

function issueMagicLinkToken(email: string, secret: string): string {
  const expires = Date.now() + MAGIC_LINK_TTL_MS
  const signature = sign(email, expires, secret)
  return Buffer.from(`${email}:${expires}:${signature}`).toString('base64url')
}

// Stateless (HMAC-signed, 15-minute expiry) rather than single-use — there's
// no revocation store, so a link can be replayed until it expires. That's an
// acceptable tradeoff for a login-convenience link; swap in a stored/
// one-time token collection later if it needs tightening.
function verifyMagicLinkToken(token: string, secret: string): string | null {
  let decoded: string
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8')
  } catch {
    return null
  }
  const [email, expiresStr, signature] = decoded.split(':')
  const expires = Number(expiresStr)
  if (!email || !signature || Number.isNaN(expires) || Date.now() > expires) return null

  const expectedBuf = Buffer.from(sign(email, expires, secret))
  const actualBuf = Buffer.from(signature)
  if (expectedBuf.length !== actualBuf.length || !timingSafeEqual(expectedBuf, actualBuf)) return null
  return email
}

const requestMagicLink: Endpoint = {
  path: '/magic-link',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const body = (await req.json?.().catch(() => null)) as { email?: string } | null
    const email = body?.email?.trim().toLowerCase()

    if (email) {
      const existing = await req.payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
        req,
      })

      if (existing.docs[0]) {
        const token = issueMagicLinkToken(email, req.payload.secret)
        const serverURL = req.payload.config.serverURL || new URL(req.url ?? 'http://localhost:3000').origin
        const apiRoute = req.payload.config.routes.api
        const link = `${serverURL}${apiRoute}/users/magic-link/callback?token=${encodeURIComponent(token)}`

        await req.payload.sendEmail({
          to: email,
          from: process.env.EMAIL_FROM,
          subject: 'Your LankaNewHomes sign-in link',
          html: `<p>Click below to sign in. This link expires in 15 minutes.</p><p><a href="${link}">${link}</a></p>`,
        })
      }
    }

    // Same response whether or not the email has an account — avoids leaking
    // which emails are registered.
    return Response.json({ message: 'If that email has an account, a sign-in link has been sent.' })
  },
}

// Verifies the token and mints a real Payload session cookie by hand (using
// Payload's own jwtSign/getFieldsToSign/generatePayloadCookie — the same
// primitives its built-in login endpoint uses), since there's no password to
// authenticate against. The resulting cookie is indistinguishable from a
// normal login, so no separate auth strategy is needed for it to work.
const magicLinkCallback: Endpoint = {
  path: '/magic-link/callback',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const token = new URL(req.url ?? '', 'http://localhost').searchParams.get('token')
    const email = token ? verifyMagicLinkToken(token, req.payload.secret) : null
    if (!email) {
      return Response.json({ error: 'Invalid or expired link.' }, { status: 400 })
    }

    const result = await req.payload.find({
      collection: 'users',
      where: { email: { equals: email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
      req,
    })
    const user = result.docs[0]
    if (!user) {
      return Response.json({ error: 'No account found for this link.' }, { status: 400 })
    }

    const collection = req.payload.collections.users

    // auth.useSessions defaults to true in Payload 3.x — the JWT strategy
    // requires a matching session (sid) on the user doc, or it treats the
    // token as invalid. Mirrors Payload's own addSessionToUser (not
    // exported from the package) since a plain JWT isn't enough on its own.
    let sid: string | undefined
    if (collection.config.auth.useSessions) {
      sid = crypto.randomUUID()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + collection.config.auth.tokenExpiration * 1000)
      const existingSessions = (Array.isArray((user as { sessions?: unknown }).sessions)
        ? ((user as { sessions: { id: string; expiresAt: string }[] }).sessions)
        : []
      ).filter((s) => new Date(s.expiresAt) > now)
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: { sessions: [...existingSessions, { id: sid, createdAt: now.toISOString(), expiresAt: expiresAt.toISOString() }] },
        overrideAccess: true,
        req,
      })
    }

    const signableUser = { ...user, collection: 'users' } as PayloadRequest['user']
    const fieldsToSign = getFieldsToSign({ collectionConfig: collection.config, email, sid, user: signableUser })
    const { token: jwt } = await jwtSign({
      fieldsToSign,
      secret: req.payload.secret,
      tokenExpiration: collection.config.auth.tokenExpiration,
    })
    const cookie = generatePayloadCookie({
      collectionAuthConfig: collection.config.auth,
      cookiePrefix: req.payload.config.cookiePrefix,
      token: jwt,
    })

    const adminRoute = req.payload.config.routes.admin || '/admin'
    const serverURL = req.payload.config.serverURL || new URL(req.url ?? 'http://localhost:3000').origin
    return new Response(null, {
      status: 302,
      headers: { Location: `${serverURL}${adminRoute}`, 'Set-Cookie': cookie },
    })
  },
}

export const magicLinkEndpoints: Endpoint[] = [requestMagicLink, magicLinkCallback]

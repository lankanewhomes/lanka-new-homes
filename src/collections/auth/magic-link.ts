import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Endpoint, PayloadRequest } from 'payload'
import { mintPayloadSessionCookie } from './mint-session'

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
    // This mints a session by hand below rather than going through Payload's
    // own login operation, so it has to enforce the same verification gate
    // that operation does (login.js's `user._verified === false` check) —
    // otherwise an unverified account could bypass email confirmation
    // entirely just by requesting a magic link instead of logging in.
    if ((user as { _verified?: boolean })._verified === false) {
      return Response.json({ error: 'Please verify your email before logging in.' }, { status: 403 })
    }

    const cookie = await mintPayloadSessionCookie(req.payload, user as { id: string | number; email: string }, req)

    const adminRoute = req.payload.config.routes.admin || '/admin'
    const serverURL = req.payload.config.serverURL || new URL(req.url ?? 'http://localhost:3000').origin
    return new Response(null, {
      status: 302,
      headers: { Location: `${serverURL}${adminRoute}`, 'Set-Cookie': cookie },
    })
  },
}

export const magicLinkEndpoints: Endpoint[] = [requestMagicLink, magicLinkCallback]

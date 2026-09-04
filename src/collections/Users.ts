import type { CollectionConfig, PayloadRequest } from 'payload'
import { adminOnly, adminOnlyField, adminOrSelfById, hiddenUnlessAdmin, isAdmin } from './access'
import { magicLinkEndpoints } from './auth/magic-link'
import { renderPasswordResetEmailHTML, renderVerificationEmailHTML } from './auth/verification-email'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function getServerURL(req: PayloadRequest): string {
  return req.payload.config.serverURL || new URL(req.url ?? 'http://localhost:3000').origin
}

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    // A new account (any role) must confirm its email before it can log in
    // — see login.js's `user._verified === false` check. That check alone
    // doesn't cover every account created *before* this was turned on
    // (their _verified was never set, i.e. null) — the JWT strategy used on
    // every later request checks _verified *truthily*, which null also
    // fails. scripts/backfill-verified.ts grandfathered those in once.
    verify: {
      generateEmailHTML: ({ req, token, user }) => {
        const serverURL = getServerURL(req)
        const adminRoute = req.payload.config.routes.admin || '/cms'
        const verificationURL = `${serverURL}${adminRoute}/users/verify/${token}`
        const loginURL = `${serverURL}${(user as { role?: string }).role === 'developer' ? '/developers/login' : '/admin-login'}`
        return renderVerificationEmailHTML({ verificationURL, loginURL })
      },
      generateEmailSubject: () => 'Confirm your LankaNewHomes account',
    },
    // Branded HTML instead of Payload's plain default — resetURL is its own
    // built-in /cms/reset/:token page, no custom page needed.
    forgotPassword: {
      generateEmailHTML: (args) => {
        if (!args?.req) return renderPasswordResetEmailHTML({ resetURL: '' })
        const { req, token } = args
        const serverURL = getServerURL(req)
        const adminRoute = req.payload.config.routes.admin || '/cms'
        const resetRoute = req.payload.config.admin.routes.reset || '/reset'
        const resetURL = `${serverURL}${adminRoute}${resetRoute}/${token}`
        return renderPasswordResetEmailHTML({ resetURL })
      },
      generateEmailSubject: () => 'Reset your LankaNewHomes password',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'full_name', 'role'],
    hidden: hiddenUnlessAdmin,
  },
  access: {
    // Public so buyers/developers can self-register; the `role` field below
    // is what actually keeps them from granting themselves admin.
    create: () => true,
    read: adminOrSelfById,
    update: adminOrSelfById,
    delete: adminOnly,
  },
  endpoints: magicLinkEndpoints,
  hooks: {
    afterChange: [
      // A developer's linked company profile used to be created by a second
      // client-side request (PayloadLoginForm signup, POST /developers)
      // made right after an auto-login — no longer possible now that a
      // fresh account is unverified and can't log in yet. Creating it here
      // instead means signup only ever needs the one request, works
      // regardless of auth state, and doesn't depend on the client
      // following up correctly. company_name is transient — captured here,
      // then cleared, never meant to live on the Users doc long-term.
      async ({ doc, operation, req }) => {
        if (operation === 'create' && doc.role === 'developer' && doc.company_name) {
          const companyName = doc.company_name as string
          const slug = slugify(companyName) || `developer-${doc.id}`
          const developer = await req.payload.create({
            collection: 'developers',
            data: { slug, name: companyName, contact_email: doc.email },
            overrideAccess: true,
            req,
          })
          // A second step, not part of the create data above: Developers'
          // own beforeChange hook forces `user` from req.user on a non-admin
          // create, and there's no authenticated req.user in this
          // server-internal call — so set the link with a follow-up update
          // instead, which that hook only touches on `create`.
          await req.payload.update({
            collection: 'developers',
            id: developer.id,
            data: { user: doc.id },
            overrideAccess: true,
            req,
          })
          await req.payload.update({
            collection: 'users',
            id: doc.id,
            data: { company_name: null },
            overrideAccess: true,
            req,
          })
        }
        return doc
      },
    ],
  },
  fields: [
    { name: 'full_name', type: 'text', label: 'Full Name', required: true },
    { name: 'phone', type: 'text' },
    {
      name: 'company_name',
      type: 'text',
      label: 'Company Name',
      admin: {
        description: 'Developer signup only — used once to auto-create the linked company profile, then cleared.',
        condition: (data) => data?.role === 'developer',
      },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      // No defaultValue on purpose: the very first account created at
      // /cms (while this collection is still empty) must
      // explicitly choose "Admin" — see the validate bootstrap branch below.
      options: [
        { label: 'Buyer', value: 'buyer' },
        { label: 'Developer', value: 'developer' },
        { label: 'Construction Company', value: 'construction_company' },
        { label: 'Admin', value: 'admin' },
      ],
      saveToJWT: true,
      access: {
        // Anyone can set it at create time (self-registration); only an
        // admin can change it afterwards.
        update: adminOnlyField,
      },
      validate: async (
        value: unknown,
        { previousValue, req }: { previousValue?: unknown; req: PayloadRequest },
      ) => {
        // Only gate an actual change *to* admin — an unrelated update to an
        // already-admin doc (e.g. the magic-link callback recording a
        // session) re-submits the unchanged value and must not be blocked.
        if (value !== 'admin' || previousValue === 'admin') return true
        if (isAdmin(req)) return true
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
        if (totalDocs === 0) return true // bootstrap: first user ever created
        return 'Only an existing admin can grant the admin role.'
      },
    },
  ],
}

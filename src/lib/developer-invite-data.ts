/* eslint-disable @typescript-eslint/no-explicit-any -- builds the invite email input from arbitrary CMS docs */
import type { DeveloperInviteInput } from '@/lib/developer-invite-email'
import { checkEmailAgainstWebsite } from '@/lib/developer-domain-verification'

// Shared by the invite preview generator and the sender so what you preview is exactly what is sent.
const INTERNAL_TODO = /^(publish\??|email )/i
const MAX_PER_LISTING = 6

export async function buildInviteInput(payload: any, d: any): Promise<DeveloperInviteInput> {
  const projects = (await payload.find({ collection: 'projects', where: { developer: { equals: d.id } }, limit: 200, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const lands = (await payload.find({ collection: 'lands', where: { sellerName: { equals: d.name } } as any, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  // Only what is live on the site (drafts have isPublished === false).
  const live = (x: any) => x.isPublished !== false
  const liveProjects = projects.filter(live)
  // Details still missing = the open rows of the CMS to-do list for this developer's live projects.
  const todos = (await payload.find({ collection: 'listing-todos', where: { and: [{ done: { equals: false } }, { project: { in: liveProjects.map((p) => p.id) } }] } as any, limit: 500, depth: 0, pagination: false, overrideAccess: true })).docs as any[]
  const missing = liveProjects
    .map((p) => {
      const items = todos.filter((t) => (typeof t.project === 'object' ? t.project?.id : t.project) === p.id && !INTERNAL_TODO.test(String(t.title))).map((t) => String(t.title).replace(/\?$/, ''))
      return { listing: String(p.name), items: items.length > MAX_PER_LISTING ? [...items.slice(0, MAX_PER_LISTING), `and ${items.length - MAX_PER_LISTING} more`] : items }
    })
    .filter((m) => m.items.length)
  return {
    name: d.name, slug: d.slug, projects: liveProjects.map((p) => p.name), lands: lands.filter(live).map((l) => l.title ?? l.name),
    phone: d.contact_phone, email: d.contact_email, address: d.location, website: d.website,
    autoVerify: Boolean(d.contact_email) && checkEmailAgainstWebsite(String(d.contact_email), d.website, d.extra_email_domains).ok,
    // Enquiries reach the developer's own address unless a listing routes them to an agency (leadsTo).
    leadsEmail: d.contact_email && !liveProjects.some((p) => p.leadsTo) ? String(d.contact_email) : null,
    missing,
  }
}

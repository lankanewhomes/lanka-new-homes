// Weekly "new matches" alert for buyers with an active saved search
// (public.saved_searches, /account/alerts) — the actual notification behind
// that page's "email notifications" on/off toggle, which until 2026-09-25
// only persisted the flag with nothing reading it (see the column's own
// comment in docs/supabase-schema.sql before that date). Runs from the
// existing analytics-digest cron (same weekly trigger as
// follower-digest.ts), not a separate Vercel cron job — same reasoning as
// that file: no Payload instance needed, one fewer cron slot used.
//
// Mechanism: for each active search, "new" means published since
// `last_notified_at` (null the first time a search is ever processed —
// unlike follower-digest's diff-against-a-snapshot, there's no prior state
// to seed here, so the very first run emails whatever currently matches
// instead of silently skipping). Capped per search so a broad filter
// ("Any type", no city) can't produce a giant email. `last_notified_at`
// only advances on a search that actually got emailed — a search with no
// current matches (or whose buyer has alerts off) keeps its old cursor, so
// nothing is silently missed once a matching listing does appear.
//
// Owner's 2026-09-24 build note (item 9): also includes a small "Featured
// projects" block — Developer Pro/Campaign's "placement in saved-search
// alert emails" perk (see the placement-inventory memory). Matched against
// the same search filters (so it's relevant, not random), shown regardless
// of whether it's "new," and excluded from also appearing in the New
// matches list so nothing is shown twice in one email.

import nodemailer from "nodemailer"
import { supabaseAdmin } from "@/lib/supabase"
import { getAllProjects } from "@/lib/project-store"
import { hasPremiumStyleBadge, isPaidPackageTier, planRotationWeight } from "@/lib/packages"
import { renderSavedSearchAlertEmailHTML } from "@/lib/saved-search-alert-email"
import { isProductionDeployment, DEFAULT_TEST_INBOX } from "@/lib/lead-alerts"
import type { Project } from "@/types"

const NEW_MATCHES_CAP = 5
const FEATURED_BLOCK_CAP = 3

type SavedSearchFilters = {
  propertyType?: string
  bedrooms?: string
  city?: string
  maxPriceLkr?: number
}

type SavedSearchRow = {
  id: number
  user_id: string
  name: string
  filters: SavedSearchFilters
  is_active: boolean
  created_at: string
  last_notified_at: string | null
}

// Same filter shape /account/alerts writes (see submit() in that page) —
// kept intentionally simple (exact/minimum matches, no fuzzy scoring),
// matching the site's other explicit filter checks (matchesFilters in
// listing-page.tsx) rather than the fancier similarity ranking
// similar-listings.ts uses for "you might also like."
export function matchesSavedSearch(project: Project, filters: SavedSearchFilters): boolean {
  if (filters.propertyType && project.type !== filters.propertyType) return false
  if (filters.city && project.city?.toLowerCase() !== filters.city.toLowerCase()) return false
  if (filters.bedrooms) {
    const minBedrooms = filters.bedrooms === "4+" ? 4 : parseInt(filters.bedrooms, 10)
    const projectBedrooms = parseInt(project.bedrooms, 10)
    if (!Number.isNaN(minBedrooms) && (Number.isNaN(projectBedrooms) || projectBedrooms < minBedrooms)) return false
  }
  if (typeof filters.maxPriceLkr === "number" && filters.maxPriceLkr > 0) {
    if (!(project.startingPriceLkr > 0 && project.startingPriceLkr <= filters.maxPriceLkr)) return false
  }
  return true
}

async function resolveBuyerEmails(userIds: string[]): Promise<Map<string, string>> {
  const emailById = new Map<string, string>()
  const chunkSize = 20
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize)
    await Promise.all(
      chunk.map(async (id) => {
        try {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(id)
          if (!error && data.user?.email) emailById.set(id, data.user.email)
        } catch {
          // Orphaned/deleted account — skip.
        }
      })
    )
  }
  return emailById
}

export async function sendSavedSearchAlerts(): Promise<{ sent: number; skipped: number; failed: number }> {
  const [projects, searchesResult] = await Promise.all([
    getAllProjects(),
    supabaseAdmin.from("saved_searches").select("id, user_id, name, filters, is_active, created_at, last_notified_at").eq("is_active", true),
  ])
  const searches = (searchesResult.data ?? []) as SavedSearchRow[]

  let sent = 0
  let skipped = 0
  let failed = 0
  if (searches.length === 0) return { sent, skipped, failed }

  const uniqueUserIds = [...new Set(searches.map((search) => search.user_id))]
  const [emailById, profilesResult] = await Promise.all([
    resolveBuyerEmails(uniqueUserIds),
    supabaseAdmin.from("profiles").select("id, full_name, notify_email").in("id", uniqueUserIds),
  ])
  const profileById = new Map((profilesResult.data ?? []).map((row) => [row.id as string, row]))

  const serverURL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lankanewhomes.com"
  const accountUrl = `${serverURL}/account/alerts`
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const searchesByUser = new Map<string, SavedSearchRow[]>()
  for (const search of searches) {
    const list = searchesByUser.get(search.user_id) ?? []
    list.push(search)
    searchesByUser.set(search.user_id, list)
  }

  for (const [userId, userSearches] of searchesByUser) {
    const email = emailById.get(userId)
    const profile = profileById.get(userId)
    if (!email || !profile || !profile.notify_email) {
      skipped += userSearches.length
      continue
    }

    const notifiedSearchIds: number[] = []
    const groups = userSearches
      .map((search) => {
        const allMatches = projects.filter((project) => matchesSavedSearch(project, search.filters))
        const newMatches = allMatches
          .filter((project) => !search.last_notified_at || (project.createdAt ?? "") > search.last_notified_at)
          .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
          .slice(0, NEW_MATCHES_CAP)
        if (newMatches.length === 0) return null

        const newSlugs = new Set(newMatches.map((project) => project.slug))
        const featured = allMatches
          .filter((project) => isPaidPackageTier(project.package) && !newSlugs.has(project.slug))
          .sort((a, b) => planRotationWeight(b.package) - planRotationWeight(a.package) || (b.finalScore ?? 0) - (a.finalScore ?? 0))
          .slice(0, FEATURED_BLOCK_CAP)

        notifiedSearchIds.push(search.id)
        return {
          searchName: search.name,
          matches: newMatches.map((project) => ({ slug: project.slug, name: project.name, city: project.city, startingPriceLkr: project.startingPriceLkr })),
          featured: featured.map((project) => ({ slug: project.slug, name: project.name, city: project.city, isPremium: hasPremiumStyleBadge(project.package) })),
        }
      })
      .filter((group): group is NonNullable<typeof group> => group !== null)

    if (groups.length === 0) {
      skipped += userSearches.length
      continue
    }

    try {
      const html = renderSavedSearchAlertEmailHTML({ buyerName: (profile.full_name as string | null) ?? null, groups, serverURL, accountUrl })
      const text = groups
        .map((group) => `${group.searchName}\n${group.matches.map((m) => `- ${m.name} (${m.city})`).join("\n")}`)
        .join("\n\n")
      // Same non-production guard as lead alerts/follower digest — a
      // local/preview test run must never reach a real buyer's inbox.
      const isTest = !isProductionDeployment()
      const testInbox = process.env.LEAD_ALERTS_OVERRIDE_TO || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX
      await transporter.sendMail({
        to: isTest ? testInbox : email,
        from: process.env.EMAIL_FROM,
        subject: `${isTest ? `[TEST — would go to ${email}] ` : ""}New listings matching your saved search`,
        html,
        text: `New matches for your saved searches:\n\n${text}\n\nManage your alerts: ${accountUrl}`,
      })
      sent += 1

      const nowIso = new Date().toISOString()
      await supabaseAdmin.from("saved_searches").update({ last_notified_at: nowIso }).in("id", notifiedSearchIds)
    } catch (error) {
      failed += 1
      console.error(`Saved-search alert failed for user ${userId}`, error)
    }
  }

  return { sent, skipped, failed }
}

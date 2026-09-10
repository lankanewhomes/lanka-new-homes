// Weekly "what's new" digest for buyers who follow a developer
// (public.saved_developers) — the actual notification behind the promise
// on /account/developments ("see their new units and price changes here").
// Runs from the existing analytics-digest cron (same weekly trigger), not
// a separate Vercel cron job — this function needs no Payload instance of
// its own, since followers are Supabase Auth buyers, not Payload accounts.
//
// Mechanism: diff each project's current price / floor-plan count /
// available units / construction-update count against the last value we
// notified on (project_notification_snapshots), email only what changed,
// then update the snapshot so next week diffs against today's reality.
// A project with no prior snapshot is seeded silently on its first run —
// never notifies "changed" against nothing.

import nodemailer from "nodemailer"
import { supabaseAdmin } from "@/lib/supabase"
import { getAllProjects } from "@/lib/project-store"
import { sortConstructionUpdates } from "@/lib/construction-updates"
import { formatLkr } from "@/lib/format"
import { renderFollowerDigestEmailHTML } from "@/lib/follower-digest-email"
import { isProductionDeployment, DEFAULT_TEST_INBOX } from "@/lib/lead-alerts"
import type { Project } from "@/types"

type Snapshot = {
  project_slug: string
  starting_price_lkr: number | null
  floor_plan_count: number
  available_units: number
  construction_update_count: number
}

type ChangeLine = { type: "price" | "units" | "construction"; text: string }
type ProjectChange = { slug: string; name: string; developerSlug: string; developerName: string; lines: ChangeLine[] }

// Builds every possible line for a project regardless of any one follower's
// preferences (the loosest case) — each follower's own notify_price_changes/
// notify_new_properties flags filter this down by `type` later, so the type
// tag (not string-matching on the rendered text) is what preferences key off.
function buildChange(project: Project, snapshot: Snapshot | undefined): ChangeLine[] {
  // No prior snapshot = first time this project has been seen by the
  // cron — seed only, nothing to compare against yet.
  if (!snapshot) return []

  const lines: ChangeLine[] = []

  if (typeof project.startingPriceLkr === "number" && snapshot.starting_price_lkr !== null && project.startingPriceLkr !== snapshot.starting_price_lkr) {
    const direction = project.startingPriceLkr < snapshot.starting_price_lkr ? "dropped" : "increased"
    lines.push({ type: "price", text: `Price ${direction} from ${formatLkr(snapshot.starting_price_lkr)} to ${formatLkr(project.startingPriceLkr)}` })
  }

  const floorPlanCount = project.floorPlans?.length ?? 0
  if (floorPlanCount > snapshot.floor_plan_count) {
    const added = floorPlanCount - snapshot.floor_plan_count
    lines.push({ type: "units", text: `${added} new floor plan${added === 1 ? "" : "s"} added` })
  }

  const availableUnits = project.availableUnits ?? 0
  if (availableUnits > snapshot.available_units) {
    const added = availableUnits - snapshot.available_units
    lines.push({ type: "units", text: `${added} more unit${added === 1 ? "" : "s"} now available` })
  }

  const constructionUpdates = sortConstructionUpdates(project.constructionUpdates ?? [])
  if (constructionUpdates.length > snapshot.construction_update_count) {
    for (const entry of constructionUpdates.slice(0, 2)) {
      const date = new Date(entry.date).toLocaleDateString("en-US", { day: "numeric", month: "short" })
      lines.push({ type: "construction", text: `New construction update — ${date}${entry.note ? `: ${entry.note}` : ""}` })
    }
  }

  return lines
}

function currentSnapshotValues(project: Project): Omit<Snapshot, "project_slug"> {
  return {
    starting_price_lkr: typeof project.startingPriceLkr === "number" ? project.startingPriceLkr : null,
    floor_plan_count: project.floorPlans?.length ?? 0,
    available_units: project.availableUnits ?? 0,
    construction_update_count: sortConstructionUpdates(project.constructionUpdates ?? []).length,
  }
}

async function resolveFollowerEmails(userIds: string[]): Promise<Map<string, string>> {
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

export async function sendFollowerDigests(): Promise<{ sent: number; skipped: number; failed: number }> {
  const projects = await getAllProjects()

  const { data: snapshotRows } = await supabaseAdmin.from("project_notification_snapshots").select("*")
  const snapshotBySlug = new Map((snapshotRows ?? []).map((row) => [row.project_slug as string, row as Snapshot]))

  const changesByDeveloperSlug = new Map<string, ProjectChange[]>()
  for (const project of projects) {
    const lines = buildChange(project, snapshotBySlug.get(project.slug))
    if (lines.length > 0) {
      const change: ProjectChange = { slug: project.slug, name: project.name, developerSlug: project.developerSlug, developerName: project.developerName, lines }
      const existing = changesByDeveloperSlug.get(project.developerSlug) ?? []
      existing.push(change)
      changesByDeveloperSlug.set(project.developerSlug, existing)
    }
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  if (changesByDeveloperSlug.size > 0) {
    const changedDeveloperSlugs = [...changesByDeveloperSlug.keys()]
    const { data: followRows } = await supabaseAdmin
      .from("saved_developers")
      .select("user_id, developer_slug")
      .in("developer_slug", changedDeveloperSlugs)

    const developerSlugsByUser = new Map<string, Set<string>>()
    for (const row of followRows ?? []) {
      const set = developerSlugsByUser.get(row.user_id as string) ?? new Set<string>()
      set.add(row.developer_slug as string)
      developerSlugsByUser.set(row.user_id as string, set)
    }

    const uniqueUserIds = [...developerSlugsByUser.keys()]
    const [emailById, profilesResult] = await Promise.all([
      resolveFollowerEmails(uniqueUserIds),
      supabaseAdmin.from("profiles").select("id, full_name, notify_email, notify_new_properties, notify_price_changes").in("id", uniqueUserIds),
    ])
    const profileById = new Map((profilesResult.data ?? []).map((row) => [row.id as string, row]))

    const serverURL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.lankanewhomes.com"
    const accountUrl = `${serverURL}/account/developments`
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })

    for (const userId of uniqueUserIds) {
      const email = emailById.get(userId)
      const profile = profileById.get(userId)
      if (!email || !profile || !profile.notify_email) {
        skipped += 1
        continue
      }

      // Re-filter each project's lines by this buyer's own preferences —
      // buildChange() computed every possible line per project once,
      // regardless of any one follower's settings; each follower's own
      // notify_price_changes/notify_new_properties flags filter by `type`
      // here. Construction-update lines have no dedicated preference flag —
      // always included once notify_email is on (a deliberate default).
      const followedSlugs = developerSlugsByUser.get(userId) ?? new Set()
      const groups = [...changesByDeveloperSlug.entries()]
        .filter(([developerSlug]) => followedSlugs.has(developerSlug))
        .map(([developerSlug, changes]) => {
          const projects = changes
            .map((change) => ({
              slug: change.slug,
              name: change.name,
              lines: change.lines
                .filter((line) => {
                  if (line.type === "price") return profile.notify_price_changes
                  if (line.type === "units") return profile.notify_new_properties
                  return true
                })
                .map((line) => line.text),
            }))
            .filter((project) => project.lines.length > 0)
          return { developerSlug, developerName: changes[0]!.developerName, projects }
        })
        .filter((group) => group.projects.length > 0)

      if (groups.length === 0) {
        skipped += 1
        continue
      }

      try {
        const html = renderFollowerDigestEmailHTML({ buyerName: (profile.full_name as string | null) ?? null, groups, serverURL, accountUrl })
        const text = groups
          .map((group) => `${group.developerName}\n${group.projects.map((p) => `- ${p.name}: ${p.lines.join("; ")}`).join("\n")}`)
          .join("\n\n")
        // Same non-production guard as lead alerts (src/lib/lead-alerts.ts)
        // — a local/preview test run must never reach a real buyer's inbox.
        const isTest = !isProductionDeployment()
        const testInbox = process.env.LEAD_ALERTS_OVERRIDE_TO || process.env.LEAD_ALERTS_TEST_INBOX || DEFAULT_TEST_INBOX
        await transporter.sendMail({
          to: isTest ? testInbox : email,
          from: process.env.EMAIL_FROM,
          subject: `${isTest ? `[TEST — would go to ${email}] ` : ""}Updates from developers you follow`,
          html,
          text: `Here's what's new from developers you follow:\n\n${text}\n\nManage what you follow: ${accountUrl}`,
        })
        sent += 1
      } catch (error) {
        failed += 1
        console.error(`Follower digest failed for user ${userId}`, error)
      }
    }
  }

  // Refresh snapshots for every project, changed or not, so next week's
  // diff is against today's reality.
  const snapshotUpserts = projects.map((project) => ({ project_slug: project.slug, ...currentSnapshotValues(project), updated_at: new Date().toISOString() }))
  try {
    if (snapshotUpserts.length > 0) {
      const { error } = await supabaseAdmin.from("project_notification_snapshots").upsert(snapshotUpserts)
      if (error) throw error
    }
  } catch (error) {
    console.error("Failed to upsert project_notification_snapshots", error)
  }

  return { sent, skipped, failed }
}

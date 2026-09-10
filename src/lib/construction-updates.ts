// Shared "newest first" ordering for a project's constructionUpdates array —
// used by both the frontend timeline (ConstructionTimelineSection) and the
// follower-digest cron (src/lib/follower-digest.ts), so "the newest update"
// means the same thing in both places regardless of the order an admin
// entered them in the CMS.

export type ConstructionUpdate = { date: string; image: string; note: string };

export function sortConstructionUpdates(updates: ConstructionUpdate[]): ConstructionUpdate[] {
  return [...updates]
    .filter((u) => u.date && u.image)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

import { supabaseAdmin } from "@/lib/supabase";
import type { ProfileEntityType, Review } from "@/types";

type ReviewRow = { id: string; data: Review };

// Approved reviews for any profile page. `entity_type`/`entity_slug` are
// written by the review sync hook; rows from before 2026-09-08 were
// backfilled (entity_type 'developer', entity_slug = developer_slug) by
// supabase/migrations/20260908090000_company_reviews_and_follows.sql.
export async function getApprovedReviewsByEntity(entityType: ProfileEntityType, entitySlug: string): Promise<Review[]> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, data")
    .eq("entity_type", entityType)
    .eq("entity_slug", entitySlug)
    .eq("status", "approved");
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);

  return ((data ?? []) as ReviewRow[])
    .map((row) => row.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getApprovedReviewsByDeveloperSlug(developerSlug: string): Promise<Review[]> {
  return getApprovedReviewsByEntity("developer", developerSlug);
}

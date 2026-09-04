import { supabaseAdmin } from "@/lib/supabase";
import type { Review } from "@/types";

type ReviewRow = { id: string; data: Review };

export async function getApprovedReviewsByDeveloperSlug(developerSlug: string): Promise<Review[]> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select("id, data")
    .eq("developer_slug", developerSlug)
    .eq("status", "approved");
  if (error) throw new Error(`Failed to load reviews: ${error.message}`);

  return ((data ?? []) as ReviewRow[])
    .map((row) => row.data)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

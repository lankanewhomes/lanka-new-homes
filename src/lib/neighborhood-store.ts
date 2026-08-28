import { supabaseAdmin } from "@/lib/supabase";
import type { Neighborhood } from "@/types";

type CreateNeighborhoodInput = {
  name: string;
  city: string;
  province: string;
  description: string;
  heroImage: string;
};

type NeighborhoodRow = {
  slug: string;
  data: Neighborhood;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function rowToNeighborhood(row: NeighborhoodRow): Neighborhood {
  return { ...row.data, slug: row.slug };
}

function neighborhoodToRow(neighborhood: Neighborhood) {
  return {
    slug: neighborhood.slug,
    name: neighborhood.name,
    city: neighborhood.city,
    province: neighborhood.province,
    data: neighborhood,
  };
}

export async function getAllNeighborhoods(): Promise<Neighborhood[]> {
  const { data, error } = await supabaseAdmin.from("neighborhoods").select("slug, data");
  if (error) throw new Error(`Failed to load neighborhoods: ${error.message}`);
  return (data ?? []).map((row) => rowToNeighborhood(row as NeighborhoodRow));
}

export async function getNeighborhoodBySlug(slug: string): Promise<Neighborhood | undefined> {
  const { data, error } = await supabaseAdmin.from("neighborhoods").select("slug, data").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load neighborhood ${slug}: ${error.message}`);
  return data ? rowToNeighborhood(data as NeighborhoodRow) : undefined;
}

export async function createNeighborhood(input: CreateNeighborhoodInput): Promise<Neighborhood> {
  const { data: existingSlugs, error: slugError } = await supabaseAdmin.from("neighborhoods").select("slug");
  if (slugError) throw new Error(`Failed to check existing slugs: ${slugError.message}`);
  const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

  const baseSlug = toSlug(input.name) || "new-neighborhood";
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const neighborhood: Neighborhood = { slug, ...input };
  const { error } = await supabaseAdmin.from("neighborhoods").insert(neighborhoodToRow(neighborhood));
  if (error) throw new Error(`Failed to create neighborhood: ${error.message}`);

  return neighborhood;
}

export async function updateNeighborhood(slug: string, changes: Partial<Omit<Neighborhood, "slug">>): Promise<Neighborhood | undefined> {
  const current = await getNeighborhoodBySlug(slug);
  if (!current) return undefined;

  const updated: Neighborhood = { ...current, ...changes, slug };
  const { error } = await supabaseAdmin.from("neighborhoods").update(neighborhoodToRow(updated)).eq("slug", slug);
  if (error) throw new Error(`Failed to update neighborhood ${slug}: ${error.message}`);

  return updated;
}

export async function deleteNeighborhood(slug: string): Promise<void> {
  const { error } = await supabaseAdmin.from("neighborhoods").delete().eq("slug", slug);
  if (error) throw new Error(`Failed to delete neighborhood ${slug}: ${error.message}`);
}

import { supabaseAdmin } from "@/lib/supabase";
import type { Land } from "@/types";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type LandRow = {
  slug: string;
  data: Land;
};

function rowToLand(row: LandRow): Land {
  return { ...row.data, slug: row.slug };
}

function landToRow(land: Land) {
  return {
    slug: land.slug,
    title: land.title,
    seller_type: land.sellerType,
    seller_slug: land.sellerSlug ?? null,
    seller_name: land.sellerName,
    status: land.status,
    price_lkr: land.priceLkr,
    district: land.district,
    city: land.city,
    province: land.province,
    is_featured: Boolean(land.isFeatured),
    data: land,
  };
}

export async function getAllLands(): Promise<Land[]> {
  const { data, error } = await supabaseAdmin.from("lands").select("slug, data");
  if (error) throw new Error(`Failed to load lands: ${error.message}`);
  return (data ?? []).map((row) => rowToLand(row as LandRow));
}

export async function getLandBySlug(slug: string): Promise<Land | undefined> {
  const { data, error } = await supabaseAdmin.from("lands").select("slug, data").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load land ${slug}: ${error.message}`);
  return data ? rowToLand(data as LandRow) : undefined;
}

export async function updateLand(slug: string, changes: Partial<Land>) {
  const existing = await getLandBySlug(slug);
  if (!existing) return undefined;

  const merged: Land = { ...existing, ...changes, slug };
  const { error } = await supabaseAdmin.from("lands").update(landToRow(merged)).eq("slug", slug);
  if (error) throw new Error(`Failed to update land ${slug}: ${error.message}`);

  return merged;
}

function defaultLandFields(input: Partial<Land>): Partial<Land> {
  return {
    sellerType: input.sellerType || "builder",
    sellerName: input.sellerName || "Seller",
    location: input.location || "Location coming soon",
    district: input.district || "",
    city: input.city || "",
    province: input.province || "",
    landSizePerches: input.landSizePerches ?? 0,
    priceLkr: input.priceLkr ?? 0,
    landUse: input.landUse && input.landUse.length > 0 ? input.landUse : ["Residential"],
    status: input.status || "Available",
    summary: input.summary || input.description || "",
    description: input.description || "",
    heroImage: input.heroImage || "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=85&w=2600&auto=format&fit=crop",
    gallery: input.gallery ?? [],
    nearby: input.nearby ?? [],
    coordinates: input.coordinates ?? { lat: 6.9271, lng: 79.8612 },
    contact: input.contact ?? { name: input.sellerName ?? "", email: "", phone: "" },
  };
}

export async function createLand(input: Partial<Land> & { title: string }) {
  const { data: existingSlugs, error: slugError } = await supabaseAdmin.from("lands").select("slug");
  if (slugError) throw new Error(`Failed to check existing slugs: ${slugError.message}`);
  const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

  const baseSlug = toSlug(input.title) || "new-land";
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const definedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<Land>;
  const land = { ...defaultLandFields(input), ...definedInput, slug } as Land;

  const { error } = await supabaseAdmin.from("lands").insert(landToRow(land));
  if (error) throw new Error(`Failed to create land: ${error.message}`);

  return getLandBySlug(slug);
}

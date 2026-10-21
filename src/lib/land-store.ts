import { supabaseAdmin } from "@/lib/supabase";
import { memoizeAsync, retryQuery } from "@/lib/retry";
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
  created_at: string;
};

function rowToLand(row: LandRow): Land {
  return { ...row.data, slug: row.slug, createdAt: row.created_at };
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

async function loadAllLands(): Promise<Land[]> {
  const { data, error } = await retryQuery(() => supabaseAdmin.from("lands").select("slug, data, created_at"));
  if (error) throw new Error(`Failed to load lands: ${error.message}`);
  return (data ?? []).map((row) => rowToLand(row as LandRow));
}

const sharedAllLands = memoizeAsync(loadAllLands);

// Callers may sort or filter the list, so each gets its own copy of the array.
export async function getAllLands(): Promise<Land[]> {
  return [...(await sharedAllLands())];
}

// Candidates for the "Similar listings" rail on a land page. Loading every land (350 rows with their plots, many MB) on each cold
// page render took 10+ seconds, so only the lands in the same district are read (falling back to a small mixed set when a
// district has too few); the ranking itself is unchanged (similar-listings.ts scores district, city, price and status).
export async function getSimilarLandCandidates(land: { slug: string; district?: string | null; city?: string | null; sellerSlug?: string | null }, limit = 60): Promise<Land[]> {
  const pick = async (build: (q: ReturnType<typeof baseQuery>) => ReturnType<typeof baseQuery>) => {
    const { data, error } = await retryQuery(() => build(baseQuery()).neq("slug", land.slug).limit(limit));
    if (error) throw new Error(`Failed to load similar lands: ${error.message}`);
    return (data ?? []).map((row) => rowToLand(row as LandRow));
  };
  // Same city first (the ranking gives it the most weight), then the rest of the district.
  let rows = land.city ? await pick((q) => q.eq("city", land.city as string)) : [];
  if (land.district && rows.length < limit) {
    const seenCity = new Set(rows.map((r) => r.slug));
    rows = [...rows, ...(await pick((q) => q.eq("district", land.district as string))).filter((r) => !seenCity.has(r.slug))].slice(0, limit * 2);
  }
  if (rows.length < 8) {
    const extra = await pick((q) => q.eq("is_featured", true));
    const seen = new Set(rows.map((r) => r.slug));
    rows = [...rows, ...extra.filter((r) => !seen.has(r.slug))];
  }
  return rows;
}
const baseQuery = () => supabaseAdmin.from("lands").select("slug, data, created_at");

export async function getLandBySlug(slug: string): Promise<Land | undefined> {
  const { data, error } = await supabaseAdmin.from("lands").select("slug, data, created_at").eq("slug", slug).maybeSingle();
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

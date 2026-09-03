import { supabaseAdmin } from "@/lib/supabase";
import type { HeroAd, HeroAdStatus } from "@/types";

type CreateHeroAdInput = {
  developerSlug: string;
  developerName: string;
  projectSlug?: string;
  image: string;
  headline: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  priceLkr: number;
};

type UpdateHeroAdInput = Partial<Pick<HeroAd, "image" | "headline" | "linkUrl" | "startDate" | "endDate" | "order" | "status" | "reviewNote" | "priceLkr">>;

type HeroAdRow = {
  id: string;
  data: HeroAd;
};

function rowToHeroAd(row: HeroAdRow): HeroAd {
  return { ...row.data, id: row.id };
}

function heroAdToRow(ad: HeroAd) {
  return {
    id: ad.id,
    developer_slug: ad.developerSlug,
    project_slug: ad.projectSlug ?? null,
    status: ad.status,
    order: ad.order,
    data: ad,
  };
}

export async function getAllHeroAds(): Promise<HeroAd[]> {
  const { data, error } = await supabaseAdmin.from("hero_ads").select("id, data");
  if (error) throw new Error(`Failed to load hero ads: ${error.message}`);
  return (data ?? [])
    .map((row) => rowToHeroAd(row as HeroAdRow))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getHeroAdsForDeveloper(developerSlug: string): Promise<HeroAd[]> {
  const ads = await getAllHeroAds();
  return ads.filter((ad) => ad.developerSlug === developerSlug);
}

export async function getActiveHeroAds(referenceDate: Date = new Date()): Promise<HeroAd[]> {
  const ads = await getAllHeroAds();
  const today = referenceDate.toISOString().slice(0, 10);

  return ads
    .filter((ad) => ad.status === "approved" && ad.startDate <= today && ad.endDate >= today)
    .sort((a, b) => a.order - b.order);
}

export async function createHeroAdRequest(input: CreateHeroAdInput): Promise<HeroAd> {
  const ads = await getAllHeroAds();

  const ad: HeroAd = {
    id: `hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    developerSlug: input.developerSlug,
    developerName: input.developerName,
    projectSlug: input.projectSlug,
    image: input.image,
    headline: input.headline,
    linkUrl: input.linkUrl,
    startDate: input.startDate,
    endDate: input.endDate,
    status: "pending",
    order: ads.length,
    priceLkr: input.priceLkr,
    submittedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("hero_ads").insert(heroAdToRow(ad));
  if (error) throw new Error(`Failed to create hero ad: ${error.message}`);

  return ad;
}

export async function updateHeroAd(id: string, changes: UpdateHeroAdInput): Promise<HeroAd | undefined> {
  const { data: row, error: readError } = await supabaseAdmin.from("hero_ads").select("id, data").eq("id", id).maybeSingle();
  if (readError) throw new Error(`Failed to load hero ad ${id}: ${readError.message}`);
  if (!row) return undefined;

  const current = rowToHeroAd(row as HeroAdRow);
  const next: HeroAd = { ...current, ...changes };
  if (next.status === "approved" && (!next.priceLkr || next.priceLkr <= 0)) {
    throw new Error("A paid placement price greater than zero is required before approval");
  }
  if (changes.status && changes.status !== "pending") {
    next.reviewedAt = new Date().toISOString();
  }

  const { error } = await supabaseAdmin.from("hero_ads").update(heroAdToRow(next)).eq("id", id);
  if (error) throw new Error(`Failed to update hero ad ${id}: ${error.message}`);

  return next;
}

export async function reorderHeroAds(orderedIds: string[]): Promise<HeroAd[]> {
  const ads = await getAllHeroAds();
  const byId = new Map(ads.map((ad) => [ad.id, ad]));

  const updates = orderedIds
    .map((id, index) => {
      const ad = byId.get(id);
      if (!ad) return null;
      return { ...ad, order: index };
    })
    .filter((ad): ad is HeroAd => ad !== null);

  for (const ad of updates) {
    const { error } = await supabaseAdmin.from("hero_ads").update({ order: ad.order, data: ad }).eq("id", ad.id);
    if (error) throw new Error(`Failed to reorder hero ad ${ad.id}: ${error.message}`);
  }

  return getAllHeroAds();
}

export async function deleteHeroAd(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from("hero_ads").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete hero ad ${id}: ${error.message}`);
}

export function isHeroAdStatus(value: unknown): value is HeroAdStatus {
  return value === "pending" || value === "approved" || value === "rejected" || value === "archived";
}

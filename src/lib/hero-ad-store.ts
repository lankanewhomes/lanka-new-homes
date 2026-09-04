import { supabaseAdmin } from "@/lib/supabase";
import type { HeroAd } from "@/types";

type HeroAdRow = {
  id: string;
  data: HeroAd;
};

function rowToHeroAd(row: HeroAdRow): HeroAd {
  return { ...row.data, id: row.id };
}

async function getAllHeroAds(): Promise<HeroAd[]> {
  const { data, error } = await supabaseAdmin.from("hero_ads").select("id, data");
  if (error) throw new Error(`Failed to load hero ads: ${error.message}`);
  return (data ?? [])
    .map((row) => rowToHeroAd(row as HeroAdRow))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getActiveHeroAds(referenceDate: Date = new Date()): Promise<HeroAd[]> {
  const ads = await getAllHeroAds();
  const today = referenceDate.toISOString().slice(0, 10);

  return ads
    .filter((ad) => ad.status === "approved" && ad.startDate <= today && ad.endDate >= today)
    .sort((a, b) => a.order - b.order);
}

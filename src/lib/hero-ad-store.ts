import { supabaseAdmin } from "@/lib/supabase";
import { weightedTake } from "@/lib/weighted-random";
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

// Owner, 2026-09-24 build notes: "if 30 developers buy Featured, homepage
// exposure means nothing... cap the hero at 5 slides... rotate homepage
// slots randomly on each page load, weighted by plan." Below the cap,
// nothing needs to rotate — keep the existing `order`-based sort so a
// handful of real hero slides still display in a stable, predictable
// sequence (matches behavior before this cap existed).
const HERO_SLOT_CAP = 5;

export async function getActiveHeroAds(referenceDate: Date = new Date()): Promise<HeroAd[]> {
  const ads = await getAllHeroAds();
  const today = referenceDate.toISOString().slice(0, 10);

  const eligible = ads.filter((ad) => ad.status === "approved" && ad.startDate <= today && ad.endDate >= today);
  if (eligible.length <= HERO_SLOT_CAP) return eligible.sort((a, b) => a.order - b.order);

  // A weight-4 (Campaign) ad is far more likely to land in the top 5 than a
  // weight-1 (Free/unlinked) one, but never guaranteed and never the only
  // one shown — see weighted-random.ts.
  return weightedTake(eligible, HERO_SLOT_CAP, (ad) => ad.planWeight ?? 1);
}

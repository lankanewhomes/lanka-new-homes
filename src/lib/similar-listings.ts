import type { Project } from "@/types";

// Picks the listings most like `current` for the "Similar listings" section
// at the bottom of every detail page (project, floor plan, land, plot).
// Pure ranking over data that already exists on each record — nothing is
// computed *about* a listing, so this stays clear of the "no derived
// numbers" rule (docs/supabase-workflow.md Standing Rule 4).
//
// Scoring, highest first: same neighborhood > same city/district > same
// property type > comparable starting price > same listing status. Ties
// break on Featured, then name. Falls back to whatever else is published
// (Featured first) so the section is never a lonely single card when the
// site has enough listings to fill it.
const PRICE_BAND = 0.35;

function similarityScore(current: Project, candidate: Project): number {
  let score = 0;
  if (current.neighborhoodSlug && candidate.neighborhoodSlug === current.neighborhoodSlug) score += 4;
  else if (current.neighborhood && candidate.neighborhood === current.neighborhood) score += 4;
  if (current.city && candidate.city === current.city) score += 2;
  else if (current.district && candidate.district === current.district) score += 2;
  if (current.type && candidate.type === current.type) score += 2;
  if (current.startingPriceLkr > 0 && candidate.startingPriceLkr > 0) {
    const ratio = candidate.startingPriceLkr / current.startingPriceLkr;
    if (ratio >= 1 - PRICE_BAND && ratio <= 1 + PRICE_BAND) score += 1;
  }
  if (current.status && candidate.status === current.status) score += 1;
  return score;
}

export function pickSimilarListings(current: Project, all: Project[], limit = 3): Project[] {
  const others = all.filter((project) => project.slug !== current.slug);
  const ranked = others
    .map((project) => ({ project, score: similarityScore(current, project) }))
    .sort((a, b) =>
      b.score - a.score ||
      Number(Boolean(b.project.isFeatured)) - Number(Boolean(a.project.isFeatured)) ||
      a.project.name.localeCompare(b.project.name),
    );
  return ranked.slice(0, limit).map((entry) => entry.project);
}

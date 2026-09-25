import { isPaidPackageTier } from "@/lib/packages";
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
//
// Rail swap (owner, 2026-09-24 build note item 7): a FREE listing's page
// keeps that site-wide pool — deliberately, since a paid competitor can
// surface here ("the main reason to upgrade," per the placement spec). A
// PAID listing's page instead only ever considers that SAME developer's
// own other listings — never a competitor, paid or free, at all. If that
// developer doesn't have enough other listings to fill `limit`, the
// section renders fewer cards (or none — SimilarListingsSection already
// returns null on an empty list) rather than backfilling with a
// competitor, since showing one at all is exactly what paying is meant to
// prevent. Land listings have no package system yet (a separate, still
// not-built item), so `current.package` is always free-ish there and this
// never changes their existing behavior.
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
  const candidates = isPaidPackageTier(current.package)
    ? others.filter((project) => project.developerSlug === current.developerSlug)
    : others;
  const ranked = candidates
    .map((project) => ({ project, score: similarityScore(current, project) }))
    .sort((a, b) =>
      b.score - a.score ||
      Number(Boolean(b.project.isFeatured)) - Number(Boolean(a.project.isFeatured)) ||
      a.project.name.localeCompare(b.project.name),
    );
  return ranked.slice(0, limit).map((entry) => entry.project);
}

// The homepage hero slider: at most 3 slides. Order: paid "hero slide" add-ons, then the Elite packages whose hero week it is,
// then (outside the demo) the existing approved rows of the hero_ads table, which this system reuses for the homepage hero.
import { getActiveHeroAds } from "@/lib/hero-ad-store";
import type { HeroAd } from "@/types";
import { MAX_HERO_SLIDES } from "./config";
import { FEATURED_DEMO } from "./demo";
import { activeBookings, eliteHeroPackages } from "./engine";
import { getFeaturedData } from "./store";

export type HeroSlide = HeroAd & { sponsored?: boolean };

export async function getHeroSlides(now = new Date()): Promise<HeroSlide[]> {
  const { state, projects } = await getFeaturedData();
  const bySlug = new Map(projects.map((project) => [project.slug, project]));
  const day = now.toISOString().slice(0, 10);
  const slides: HeroSlide[] = [];
  const add = (id: string, developerSlug: string, developerName: string, projectSlug: string | undefined, image: string, headline: string, linkUrl: string) => {
    if (!image || (projectSlug && slides.some((slide) => slide.projectSlug === projectSlug))) return;
    slides.push({ id, developerSlug, developerName, projectSlug, image, headline, linkUrl, startDate: day, endDate: day, status: "approved", order: slides.length, priceLkr: null, submittedAt: day, sponsored: true });
  };

  for (const booking of activeBookings(state, now, "hero-slide")) {
    const project = booking.projectSlug ? bySlug.get(booking.projectSlug) : undefined;
    add(booking.id, booking.developerSlug, project?.developerName ?? booking.developerSlug, booking.projectSlug, booking.creative?.image || project?.heroImage || "", booking.creative?.headline || project?.name || "", booking.creative?.ctaHref || (project ? `/projects/${project.slug}` : "/projects"));
  }
  for (const pkg of eliteHeroPackages(state, now)) {
    const project = bySlug.get(pkg.projectSlugs[0]);
    if (project) add(`elite-${pkg.id}`, pkg.developerSlug, project.developerName, project.slug, project.heroImage, project.name, `/projects/${project.slug}`);
  }
  if (!FEATURED_DEMO) {
    try {
      for (const ad of await getActiveHeroAds(now)) slides.push({ ...ad, sponsored: true });
    } catch {
      // hero_ads unreachable: fall through to the page's own fallback slides
    }
  }
  return slides.slice(0, MAX_HERO_SLIDES);
}

import type { Metadata } from "next";
import { getAllNeighborhoods, getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getAllProjects } from "@/lib/project-store";
import { getAllLands } from "@/lib/land-store";
import { landsInArea } from "@/lib/area-lands";
import { areaDescription, areaTitle } from "@/lib/area-meta";
import { withSocial } from "@/lib/seo";
import { NeighborhoodView } from "@/components/marketplace/neighborhood-page-view";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type NeighborhoodPageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const neighborhoods = await getAllNeighborhoods();
  return neighborhoods.map((neighborhood) => ({ slug: neighborhood.slug }));
}

export async function generateMetadata({ params }: NeighborhoodPageProps): Promise<Metadata> {
  const { slug } = await params;
  const neighborhood = await getNeighborhoodBySlug(slug);

  if (!neighborhood) {
    return { title: "Neighborhood Not Found", robots: { index: false, follow: false } };
  }

  // Titles that match what people type on Google. Owner, 2026-11-01: Search Console showed "meegoda", "kiriwaththuduwa",
  // "thalawathugoda", "raddolugama" shown hundreds of times with almost no clicks, and Ubersuggest showed the real searches are
  // "houses for sale in <area>" and "land for sale in <area>" (docs/seo-opportunities-2026-11-02.md), so both phrases are in the title.
  const [projectsHere, landsHere] = await Promise.all([getAllProjects(), getAllLands()]);
  const areaProjects = projectsHere.filter((project) => project.neighborhoodSlug === slug);
  const areaPlots = landsInArea(landsHere, neighborhood);
  const positive = (values: number[]) => values.filter((value) => value > 0);
  const homePrices = positive(areaProjects.map((project) => project.startingPriceLkr));
  const perchPrices = positive(areaPlots.map((land) => land.pricePerPerchLkrMin ?? 0));
  const meta = {
    name: neighborhood.name,
    city: neighborhood.city,
    district: neighborhood.district,
    homeCount: areaProjects.length,
    plotCount: areaPlots.length,
    lowestHomePrice: homePrices.length ? Math.min(...homePrices) : 0,
    lowestPerPerch: perchPrices.length ? Math.min(...perchPrices) : 0,
    intro: neighborhood.description,
  };
  const title = areaTitle(meta);
  const canonicalPath = `/neighborhoods/${neighborhood.slug}`;
  // Google shows about 160 characters of description.
  const description = areaDescription(meta);

  return withSocial({
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      images: [{ url: neighborhood.heroImage, alt: neighborhood.name }],
    },
  });
}
export default async function NeighborhoodPage({ params }: NeighborhoodPageProps) {
  const { slug } = await params;
  return <NeighborhoodView slug={slug} />;
}

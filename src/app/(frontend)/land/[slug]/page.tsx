import { withSocial } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLandBySlug } from "@/lib/land-store";
import { LandDetail, fallbackLandDescription } from "@/components/land/land-detail";

// Regenerate at most once a minute so admin edits (e.g. status changes)
// show up without waiting for the next deploy.
export const revalidate = 60;

type LandPageProps = { params: Promise<{ slug: string }> };

// Titles get " | LankaNewHomes" appended by the root layout; search results cut off past ~60 characters
// in total, so use the shorter form when the full one would overflow.
const TITLE_BUDGET = 60 - " | LankaNewHomes".length;
function fitTitle(full: string, short: string): string {
  if (full.length <= TITLE_BUDGET) return full;
  return short.length <= TITLE_BUDGET ? short : `${short.slice(0, TITLE_BUDGET - 1).trimEnd()}…`;
}

export async function generateMetadata({ params }: LandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const land = await getLandBySlug(slug);

  if (!land) {
    return { title: "Land Listing Not Found", robots: { index: false, follow: false } };
  }

  return withSocial({
    title: fitTitle(`${land.title} - Land for Sale in ${land.location}`, `${land.title} - Land for Sale`),
    description: land.summary?.trim() || fallbackLandDescription(land),
    alternates: { canonical: `/land/${land.slug}` },
    robots: land.status === "Sold" ? { index: false, follow: true } : undefined,
  }, { socialTitle: `${land.title} - Land for Sale in ${land.location}`, image: land.heroImage, imageAlt: land.title });
}

export default async function LandDetailPage({ params }: LandPageProps) {
  const { slug } = await params;
  const land = await getLandBySlug(slug);
  if (!land) return notFound();
  return <LandDetail land={land} />;
}

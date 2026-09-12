import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlugRaw } from "@/lib/project-store";
import { getNeighborhoodBySlug } from "@/lib/neighborhood-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { ListingPreviewPage } from "@/components/listing-preview/listing-preview";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Listing Preview",
  robots: { index: false, follow: false },
};

// Not linked from anywhere on the site — reachable only via its direct URL
// (the "Preview Link" field on the project in /cms), so a developer can send
// it to whoever needs to see the listing before flipping isPublished on.
// Uses getProjectBySlugRaw (not getProjectBySlug) specifically so drafts —
// which the public site hides — still render here.
export default async function ListingPreviewRoute({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlugRaw(slug);
  if (!project) return notFound();

  const neighborhood = project.neighborhoodSlug ? await getNeighborhoodBySlug(project.neighborhoodSlug) : undefined;
  const developer = await getDeveloperBySlug(project.developerSlug);

  return <ListingPreviewPage project={project} developer={developer} neighborhood={neighborhood} neighborhoodPageExists={Boolean(neighborhood)} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/project-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { ListingPreviewPage } from "@/components/listing-preview/listing-preview";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Listing Design Preview",
  robots: { index: false, follow: false },
};

export default async function ListingPreviewRoute({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return notFound();

  const developer = await getDeveloperBySlug(project.developerSlug);

  return <ListingPreviewPage project={project} developer={developer} />;
}

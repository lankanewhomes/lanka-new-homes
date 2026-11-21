import type { Metadata } from "next";
import { NeighborhoodView } from "@/components/marketplace/neighborhood-page-view";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Neighborhood Preview",
  robots: { index: false, follow: false },
};

// Not linked from anywhere on the site. Shows a neighbourhood page even while it is a draft
// (isPublished off), so it can be checked before going live. Same page as /neighborhoods/<slug>.
export default async function NeighborhoodPreviewRoute({ params }: Props) {
  const { slug } = await params;
  return <NeighborhoodView slug={slug} preview />;
}

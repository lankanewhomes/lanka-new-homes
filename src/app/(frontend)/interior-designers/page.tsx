import type { Metadata } from "next";
import { getAllInteriorDesigners } from "@/lib/interior-designer-store";
import { CompanyProfileListView } from "@/components/marketplace/company-profile-views";

// Regenerate at most once a minute so admin edits show up without waiting for the next deploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Interior Designers in Sri Lanka | Directory",
  description: "Browse interior designers behind new home developments in Sri Lanka.",
  alternates: { canonical: "/interior-designers" },
};

export default async function InteriorDesignersPage() {
  const designers = await getAllInteriorDesigners();

  return (
    <CompanyProfileListView
      title="Interior Designers in Sri Lanka"
      intro="These interior designers have worked on new home developments listed on this site."
      entityLabel="Interior Designer"
      basePath="/interior-designers"
      companies={designers}
    />
  );
}

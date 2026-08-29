import type { Metadata } from "next";
import { getAllArchitects } from "@/lib/architect-store";
import { CompanyProfileListView } from "@/components/marketplace/company-profile-views";

export const metadata: Metadata = {
  title: "Architects in Sri Lanka | Directory",
  description: "Browse architecture firms behind new home developments in Sri Lanka.",
  alternates: { canonical: "/architects" },
};

export default async function ArchitectsPage() {
  const architects = await getAllArchitects();

  return (
    <CompanyProfileListView
      title="Architects in Sri Lanka"
      intro="These architecture firms have designed new home developments listed on this site."
      entityLabel="Architect"
      basePath="/architects"
      companies={architects}
    />
  );
}

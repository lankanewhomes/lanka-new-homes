import type { Metadata } from "next";
import { getAllMarketingCompanies } from "@/lib/marketing-company-store";
import { CompanyProfileListView } from "@/components/marketplace/company-profile-views";

export const metadata: Metadata = {
  title: "Marketing Companies in Sri Lanka | Directory",
  description: "Browse marketing companies working with new home developments in Sri Lanka.",
  alternates: { canonical: "/marketing-companies" },
};

export default async function MarketingCompaniesPage() {
  const companies = await getAllMarketingCompanies();

  return (
    <CompanyProfileListView
      title="Marketing Companies in Sri Lanka"
      intro="These marketing companies handle campaigns, creative, and demand generation for new home developments across Sri Lanka."
      entityLabel="Marketing Company"
      basePath="/marketing-companies"
      companies={companies}
    />
  );
}

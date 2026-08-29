import type { Metadata } from "next";
import { getAllSalesCompanies } from "@/lib/sales-company-store";
import { CompanyProfileListView } from "@/components/marketplace/company-profile-views";

export const metadata: Metadata = {
  title: "Sales Companies in Sri Lanka | Directory",
  description: "Browse sales companies representing new home developments in Sri Lanka.",
  alternates: { canonical: "/sales-companies" },
};

export default async function SalesCompaniesPage() {
  const companies = await getAllSalesCompanies();

  return (
    <CompanyProfileListView
      title="Sales Companies in Sri Lanka"
      intro="These sales companies handle unit sales and buyer enquiries for new home developments across Sri Lanka."
      entityLabel="Sales Company"
      basePath="/sales-companies"
      companies={companies}
    />
  );
}

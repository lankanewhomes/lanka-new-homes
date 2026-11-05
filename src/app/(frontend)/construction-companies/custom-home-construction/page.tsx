import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import { ConstructionCompanyShell } from "@/components/marketplace/construction-company-shell";
import { constructionCompanyPages, buildConstructionCompanyMetadata } from "@/lib/construction-company-categories";

const config = constructionCompanyPages["custom-home-construction"];
export const metadata = buildConstructionCompanyMetadata(config);

export default async function CustomHomeConstructionPage() {
  // Every company that builds houses: all except those listed only as pool or consulting specialists.
  const companies = (await getAllConstructionCompanies()).filter((company) => company.categories.some((category) => category === "general" || category === "colombo"));

  return <ConstructionCompanyShell config={config} companies={companies} />;
}

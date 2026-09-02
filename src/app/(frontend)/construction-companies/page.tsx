import { getAllConstructionCompanies } from "@/lib/construction-company-store";
import { ConstructionCompanyShell } from "@/components/marketplace/construction-company-shell";
import { constructionCompanyPages, buildConstructionCompanyMetadata } from "@/lib/construction-company-categories";

const config = constructionCompanyPages["all"];
export const metadata = buildConstructionCompanyMetadata(config);

export default async function ConstructionCompaniesPage() {
  const companies = await getAllConstructionCompanies();

  return <ConstructionCompanyShell config={config} companies={companies} />;
}

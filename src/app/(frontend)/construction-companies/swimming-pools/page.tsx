import { getConstructionCompaniesByCategory } from "@/lib/construction-company-store";
import { ConstructionCompanyShell } from "@/components/marketplace/construction-company-shell";
import { constructionCompanyPages, buildConstructionCompanyMetadata } from "@/lib/construction-company-categories";

const config = constructionCompanyPages["swimming-pools"];
export const metadata = buildConstructionCompanyMetadata(config);

export default async function ConstructionCompaniesSwimmingPoolsPage() {
  const companies = await getConstructionCompaniesByCategory(config.category);

  return <ConstructionCompanyShell config={config} companies={companies} />;
}

import { companyProfileListHandlers } from "@/lib/company-profile-api";
import { createMarketingCompany, getAllMarketingCompanies, getMarketingCompanyBySlug, updateMarketingCompany } from "@/lib/marketing-company-store";

export const { GET, POST } = companyProfileListHandlers({
  getAll: getAllMarketingCompanies,
  getBySlug: getMarketingCompanyBySlug,
  create: createMarketingCompany,
  update: updateMarketingCompany,
});

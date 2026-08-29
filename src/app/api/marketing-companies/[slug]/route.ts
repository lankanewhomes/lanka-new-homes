import { companyProfileItemHandlers } from "@/lib/company-profile-api";
import { createMarketingCompany, getAllMarketingCompanies, getMarketingCompanyBySlug, updateMarketingCompany } from "@/lib/marketing-company-store";

export const { GET, PATCH } = companyProfileItemHandlers(
  {
    getAll: getAllMarketingCompanies,
    getBySlug: getMarketingCompanyBySlug,
    create: createMarketingCompany,
    update: updateMarketingCompany,
  },
  "Marketing company",
);

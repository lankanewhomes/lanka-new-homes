import { companyProfileItemHandlers } from "@/lib/company-profile-api";
import { createSalesCompany, getAllSalesCompanies, getSalesCompanyBySlug, updateSalesCompany } from "@/lib/sales-company-store";

export const { GET, PATCH } = companyProfileItemHandlers(
  {
    getAll: getAllSalesCompanies,
    getBySlug: getSalesCompanyBySlug,
    create: createSalesCompany,
    update: updateSalesCompany,
  },
  "Sales company",
);

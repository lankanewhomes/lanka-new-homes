import { companyProfileListHandlers } from "@/lib/company-profile-api";
import { createSalesCompany, getAllSalesCompanies, getSalesCompanyBySlug, updateSalesCompany } from "@/lib/sales-company-store";

export const { GET, POST } = companyProfileListHandlers({
  getAll: getAllSalesCompanies,
  getBySlug: getSalesCompanyBySlug,
  create: createSalesCompany,
  update: updateSalesCompany,
});

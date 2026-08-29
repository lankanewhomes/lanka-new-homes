import { createCompanyProfileStore } from "@/lib/company-profile-store";

const store = createCompanyProfileStore("marketing_companies");

export const getAllMarketingCompanies = store.getAll;
export const getMarketingCompanyBySlug = store.getBySlug;
export const createMarketingCompany = store.create;
export const updateMarketingCompany = store.update;

import { createCompanyProfileStore } from "@/lib/company-profile-store";

const store = createCompanyProfileStore("sales_companies");

export const getAllSalesCompanies = store.getAll;
export const getSalesCompanyBySlug = store.getBySlug;
export const createSalesCompany = store.create;
export const updateSalesCompany = store.update;

import { createCompanyProfileStore } from "@/lib/company-profile-store";

const store = createCompanyProfileStore("interior_designers");

export const getAllInteriorDesigners = store.getAll;
export const getInteriorDesignerBySlug = store.getBySlug;
export const createInteriorDesigner = store.create;
export const updateInteriorDesigner = store.update;

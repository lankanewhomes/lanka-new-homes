import { createCompanyProfileStore } from "@/lib/company-profile-store";

const store = createCompanyProfileStore("architects");

export const getAllArchitects = store.getAll;
export const getArchitectBySlug = store.getBySlug;
export const createArchitect = store.create;
export const updateArchitect = store.update;

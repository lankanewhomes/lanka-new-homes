import { companyProfileListHandlers } from "@/lib/company-profile-api";
import { createArchitect, getAllArchitects, getArchitectBySlug, updateArchitect } from "@/lib/architect-store";

export const { GET, POST } = companyProfileListHandlers({
  getAll: getAllArchitects,
  getBySlug: getArchitectBySlug,
  create: createArchitect,
  update: updateArchitect,
});

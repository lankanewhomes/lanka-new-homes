import { companyProfileItemHandlers } from "@/lib/company-profile-api";
import { createArchitect, getAllArchitects, getArchitectBySlug, updateArchitect } from "@/lib/architect-store";

export const { GET, PATCH } = companyProfileItemHandlers(
  {
    getAll: getAllArchitects,
    getBySlug: getArchitectBySlug,
    create: createArchitect,
    update: updateArchitect,
  },
  "Architect",
);

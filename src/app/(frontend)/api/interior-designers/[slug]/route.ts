import { companyProfileItemHandlers } from "@/lib/company-profile-api";
import { createInteriorDesigner, getAllInteriorDesigners, getInteriorDesignerBySlug, updateInteriorDesigner } from "@/lib/interior-designer-store";

export const { GET, PATCH } = companyProfileItemHandlers(
  {
    getAll: getAllInteriorDesigners,
    getBySlug: getInteriorDesignerBySlug,
    create: createInteriorDesigner,
    update: updateInteriorDesigner,
  },
  "Interior designer",
);

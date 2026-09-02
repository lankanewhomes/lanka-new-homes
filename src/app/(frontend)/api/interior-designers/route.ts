import { companyProfileListHandlers } from "@/lib/company-profile-api";
import { createInteriorDesigner, getAllInteriorDesigners, getInteriorDesignerBySlug, updateInteriorDesigner } from "@/lib/interior-designer-store";

export const { GET, POST } = companyProfileListHandlers({
  getAll: getAllInteriorDesigners,
  getBySlug: getInteriorDesignerBySlug,
  create: createInteriorDesigner,
  update: updateInteriorDesigner,
});

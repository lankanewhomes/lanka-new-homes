import { getAllProjects } from "@/lib/project-store";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import { projectCategories, buildCategoryMetadata } from "@/lib/listing-categories";

const category = projectCategories["colombo-luxury"];
export const metadata = buildCategoryMetadata(category);

export default async function ColomboLuxuryPage() {
  const projects = (await getAllProjects()).filter(category.filter);

  return (
    <ProjectListingShell
      breadcrumbs={category.breadcrumbs}
      h1={category.h1}
      intro={category.intro}
      projects={projects}
      relatedPaths={category.relatedPaths}
    />
  );
}

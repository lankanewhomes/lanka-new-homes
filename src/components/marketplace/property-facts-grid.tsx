import type { FactItem, Project } from "@/types";

function hasValue(value: unknown): value is string {
  return typeof value === "string" && value.trim() !== "" && value !== "-";
}

// Default seed data — used whenever a project has no admin-edited
// factsGrid yet. Any row whose source field is empty is dropped.
function defaultFacts(project: Project): FactItem[] {
  const candidates: (FactItem | null)[] = [
    hasValue(project.type) ? { key: "building", label: "Building", value: project.type } : null,
    project.completionYear > 0 ? { key: "builtIn", label: "Built in", value: String(project.completionYear) } : null,
    project.units > 0 ? { key: "residences", label: "Residences", value: String(project.units) } : null,
    project.floors > 0 ? { key: "stories", label: "Stories", value: String(project.floors) } : null,
    hasValue(project.bedrooms) ? { key: "bedrooms", label: "Bedrooms", value: project.bedrooms } : null,
    hasValue(project.bathrooms) ? { key: "bathrooms", label: "Bathrooms", value: project.bathrooms } : null,
    hasValue(project.floorAreaRange) ? { key: "size", label: "Size", value: project.floorAreaRange } : null,
    hasValue(project.parking) ? { key: "parking", label: "Parking", value: project.parking } : null,
    hasValue(project.ownership) ? { key: "ownership", label: "Ownership", value: project.ownership } : null,
    hasValue(project.constructionStatus) ? { key: "status", label: "Status", value: project.constructionStatus } : null,
  ];
  return candidates.filter((fact): fact is FactItem => fact !== null);
}

export function PropertyFactsGrid({ project }: { project: Project }) {
  const facts = project.factsGrid && project.factsGrid.length > 0 ? project.factsGrid : defaultFacts(project);
  if (facts.length === 0) return null;

  return (
    <div
      className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-5 sm:gap-x-8 sm:gap-y-6"
      style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif" }}
      role="list"
      aria-label="Property facts"
    >
      {facts.map((fact, index) => {
        const mobileDivider = index >= 2;
        const desktopDivider = index >= 5;

        return (
          <div
            key={fact.key}
            role="listitem"
            className={[
              "flex flex-col gap-1",
              mobileDivider ? "border-t border-gray-200 pt-4" : "",
              desktopDivider ? "sm:border-t sm:border-gray-200 sm:pt-6" : "sm:border-t-0 sm:pt-0",
            ].join(" ")}
          >
            <span className="text-[13px] font-normal text-gray-500">{fact.label}</span>
            <span className="text-[15px] font-medium text-[#1A1A1A] tabular-nums">{fact.value}</span>
          </div>
        );
      })}
    </div>
  );
}

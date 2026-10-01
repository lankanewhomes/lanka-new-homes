import type { FloorPlan, Project } from "@/types";

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && value.trim() !== "-";
const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/**
 * A floor plan with no parking of its own inherits the project's (parking count,
 * type, or the free-text parking note) so every floor plan page shows parking
 * wherever the listing states it (owner, 2026-10-01: "check other listings with
 * parking, include in floor plans pages also"). Plain module so server pages can use it.
 */
export function withProjectParking(plan: FloorPlan, project: Project): FloorPlan {
  const note = hasText(project.parking) ? project.parking.trim() : undefined;
  return {
    ...plan,
    parkingSpaces: hasNumber(plan.parkingSpaces) ? plan.parkingSpaces : hasNumber(project.parkingCount) ? project.parkingCount : undefined,
    parkingType: hasText(plan.parkingType) ? plan.parkingType : hasText(project.parkingType) ? project.parkingType : note,
  };
}

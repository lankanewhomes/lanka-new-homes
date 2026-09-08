import type { ProfileEntityType } from "@/types";

// One place that knows how the six reviewable/followable profile types map
// onto Payload collections, public URLs and labels — used by the reviews
// API, the review sync hook, the follow hook and the shared ProfileView.

export const PROFILE_ENTITY_TYPES: ProfileEntityType[] = [
  "developer",
  "marketing-company",
  "sales-company",
  "architect",
  "interior-designer",
  "construction-company",
];

export const PROFILE_ENTITY_COLLECTION: Record<ProfileEntityType, string> = {
  developer: "developers",
  "marketing-company": "marketing-companies",
  "sales-company": "sales-companies",
  architect: "architects",
  "interior-designer": "interior-designers",
  "construction-company": "construction-companies",
};

export const PROFILE_ENTITY_LABEL: Record<ProfileEntityType, string> = {
  developer: "Developer",
  "marketing-company": "Marketing Company",
  "sales-company": "Sales Company",
  architect: "Architect",
  "interior-designer": "Interior Designer",
  "construction-company": "Construction Company",
};

export const PROFILE_ENTITY_BASE_PATH: Record<ProfileEntityType, string> = {
  developer: "/developers",
  "marketing-company": "/marketing-companies",
  "sales-company": "/sales-companies",
  architect: "/architects",
  "interior-designer": "/interior-designers",
  "construction-company": "/construction-companies",
};

export function isProfileEntityType(value: unknown): value is ProfileEntityType {
  return typeof value === "string" && (PROFILE_ENTITY_TYPES as string[]).includes(value);
}

"use client";

import type { Developer, Project, Review } from "@/types";
import { ProfileView } from "@/components/marketplace/profile-view";

// Thin wrapper kept for the developer page's import; the actual page lives in
// profile-view.tsx and is shared with the partner-directory profiles.
export function DeveloperProfileView({ developer, projects, reviews = [] }: { developer: Developer; projects: Project[]; reviews?: Review[] }) {
  return <ProfileView entity={developer} entityType="developer" entityLabel="Developer" projects={projects} reviews={reviews} />;
}

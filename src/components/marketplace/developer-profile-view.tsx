"use client";

import type { Developer, Project, Review } from "@/types";
import { ProfileView } from "@/components/marketplace/profile-view";

// Thin wrapper kept for the developer page's import; the actual page lives in
// profile-view.tsx and is shared with the partner-directory profiles.
export function DeveloperProfileView({ developer, projects, reviews = [] }: { developer: Developer; projects: Project[]; reviews?: Review[] }) {
  return (
    <>
      <ProfileView entity={developer} entityType="developer" entityLabel="Developer" projects={projects} reviews={reviews} />
      <DeveloperAbout developer={developer} projects={projects} />
    </>
  );
}

const joinNames = (names: string[]) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

// A written "About" block built only from what's stored on the developer and their listings (no estimates):
// gives every profile real, crawlable text (SEO audit 2026-10-01: developer pages had 65–95 words) and answers
// the questions a buyer or an AI assistant asks first — who they are, where they build, what they're selling.
function DeveloperAbout({ developer, projects }: { developer: Developer; projects: Project[] }) {
  const homes = projects.filter((p) => !p.isLand);
  const lands = projects.filter((p) => p.isLand);
  const place = (p: Project) => [p.location || p.city].filter(Boolean).join("");
  const listingLine = (list: Project[]) => joinNames(list.slice(0, 6).map((p) => `${p.name}${place(p) ? ` (${place(p)})` : ""}`));
  const areas = Array.from(new Set(projects.map((p) => p.city).filter(Boolean)));

  return (
    <section className="developer-about-box" aria-label={`About ${developer.name}`}>
      <h2>About {developer.name}</h2>
      {developer.description ? <p>{developer.description}</p> : null}
      <p>
        {developer.name} is a property developer
        {developer.location ? ` based in ${developer.location}` : ""}
        {developer.establishedYear ? `, established in ${developer.establishedYear}` : ""}
        {developer.yearsInBusiness ? ` and in business for ${developer.yearsInBusiness} years` : ""}.
        {projects.length > 0
          ? ` On LankaNewHomes you can browse ${projects.length === 1 ? "its listing" : `its ${projects.length} listings`}${areas.length ? ` across ${joinNames(areas.slice(0, 6))}` : ""}.`
          : " Its projects will appear here as they are listed."}
      </p>
      {homes.length > 0 ? <p>Homes and apartments: {listingLine(homes)}.</p> : null}
      {lands.length > 0 ? <p>Land and plots: {listingLine(lands)}.</p> : null}
      <p>
        Every listing includes photos, floor plans or plot details, payment plans, nearby places and a location map, so you can compare options before you
        decide. To ask about prices, availability or a site visit, use the enquiry form on any {developer.name} listing — your message goes straight to the
        developer. Listing on LankaNewHomes is free for developers and buyers can contact them directly, with no agent in between.
      </p>
    </section>
  );
}

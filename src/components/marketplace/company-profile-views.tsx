import type { CompanyProfile, ProfileEntityType, Project, Review } from "@/types";
import { ProfileView } from "@/components/marketplace/profile-view";
import { PartnerDirectoryCard } from "@/components/marketplace/partner-directory-card";

export function CompanyProfileListView({
  title,
  intro,
  entityLabel,
  basePath,
  companies,
}: {
  title: string;
  intro: string;
  entityLabel: string;
  basePath: string;
  companies: CompanyProfile[];
}) {
  return (
    <div>
      <div className="listing-page-intro">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>

      <p className="partner-directory-count">
        {companies.length} {entityLabel.toLowerCase()}{companies.length === 1 ? "" : "s"}
      </p>

      <div className="partner-directory-grid">
        {companies.map((company) => (
          <PartnerDirectoryCard
            key={company.slug}
            slug={company.slug}
            basePath={basePath}
            name={company.name}
            logo={company.logo}
            location={company.location}
            description={company.description}
            yearsInBusiness={company.yearsInBusiness}
            phone={company.phone}
          />
        ))}
      </div>

      {companies.length === 0 ? <p className="partner-directory-count">No {entityLabel.toLowerCase()}s listed yet.</p> : null}
    </div>
  );
}

// Partner-directory profile pages (marketing/sales companies, architects,
// interior designers, construction companies) render the exact same page as
// a developer — reviews, follow, contact, socials, tabs — via ProfileView.
// This used to be a cut-down copy without reviews or follow (see
// 2026-09-08); don't reintroduce a separate layout here.
export function CompanyProfileDetailView({
  company,
  entityType,
  entityLabel,
  projects,
  reviews = [],
}: {
  company: CompanyProfile;
  entityType: Exclude<ProfileEntityType, "developer">;
  entityLabel: string;
  projects: Project[];
  reviews?: Review[];
}) {
  return <ProfileView entity={company} entityType={entityType} entityLabel={entityLabel} projects={projects} reviews={reviews} />;
}

import type { CompanyProfile, ProfileEntityType, Project, Review } from "@/types";
import { ProfileView } from "@/components/marketplace/profile-view";
import { PartnerDirectoryPage } from "@/components/marketplace/partner-directory-page";

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
  const plural = `${entityLabel.toLowerCase()}s`;
  return (
    <PartnerDirectoryPage
      title={`${title}.`}
      intro={intro}
      noun={entityLabel.toLowerCase()}
      nounPlural={plural}
      basePath={basePath}
      entries={companies}
      about={{
        title: `About the ${entityLabel.toLowerCase()} directory.`,
        paragraphs: [
          `This directory lists the ${companies.length} ${companies.length === 1 ? entityLabel.toLowerCase() : plural} connected to the new homes on LankaNewHomes. Each has a profile page showing who they are, where they work, how long they have been in business and the projects they are linked to.`,
          `Open a profile to see their work and get in touch directly. Comparing a few ${plural} on their earlier projects is one of the most useful steps before you choose who to work with.`,
        ],
      }}
      related={[
        { label: "Developers", href: "/developers", note: "The companies building new homes." },
        { label: "New projects", href: "/projects", note: "Apartments, villas and houses." },
        { label: "Neighborhood guides", href: "/neighborhoods", note: "Compare areas across Sri Lanka." },
      ]}
    />
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

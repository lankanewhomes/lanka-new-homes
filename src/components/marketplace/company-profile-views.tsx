"use client";

import Image from "next/image";
import Link from "next/link";
import type { CompanyProfile, ProfileEntityType, Project, Review } from "@/types";
import { ProfileView } from "@/components/marketplace/profile-view";

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
    <div className="space-y-4">
      <div className="listing-page-intro">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>

      <p className="text-sm font-medium text-stone-700">
        {companies.length} {entityLabel.toLowerCase()}{companies.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        {companies.map((company) => (
          <Link key={company.slug} href={`${basePath}/${company.slug}`} className="grid grid-cols-[80px_1fr] gap-3 border border-stone-200 bg-white p-4 transition-colors hover:border-stone-400">
            {company.logo ? (
              <Image src={company.logo} alt={`${company.name} logo`} width={80} height={80} className="h-20 w-20 rounded-sm object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-sm bg-stone-100" aria-hidden="true" />
            )}
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-stone-900">{company.name}</h2>
              <p className="text-sm text-stone-600">{company.location}</p>
              <p className="text-sm text-stone-700">{company.description}</p>
              {company.yearsInBusiness ? <p className="pt-1 text-xs text-stone-500">{company.yearsInBusiness} years in business</p> : null}
            </div>
          </Link>
        ))}
      </div>

      {companies.length === 0 ? <p className="text-sm text-stone-500">No {entityLabel.toLowerCase()}s listed yet.</p> : null}
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

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { House } from "lucide-react";
import type { CompanyProfile, Project } from "@/types";
import { formatLkr, formatOfficeHours } from "@/lib/format";
import { SOCIAL_ICON } from "@/components/marketplace/components";

type CompanyTab = "projects" | "awards" | "press";

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

export function CompanyProfileDetailView({ company, entityLabel, projects }: { company: CompanyProfile; entityLabel: string; projects: Project[] }) {
  const [tab, setTab] = useState<CompanyTab>("projects");
  const socialEntries = Object.entries(company.socialLinks ?? {}).filter(([, url]) => Boolean(url)) as [string, string][];
  const formattedOfficeHours = formatOfficeHours(company.officeHours);

  return (
    <div className="developer-profile">
      <aside className="developer-profile-sidebar">
        {company.logo ? (
          <div className="developer-profile-logo">
            <div className={company.logo.startsWith("/") ? "developer-profile-logo-chip" : undefined}>
              <Image src={company.logo} alt={company.name} width={220} height={90} />
            </div>
          </div>
        ) : null}
        <h1>{company.name}</h1>
        <p className="developer-profile-role">{entityLabel}</p>

        <div className="developer-profile-contact">
          <p>{company.location}</p>
          {company.phone ? <p>{company.phone}</p> : null}
          {company.website ? <a href={company.website} target="_blank" rel="noopener noreferrer">{company.website.replace(/^https?:\/\//, "")}</a> : null}
        </div>

        {socialEntries.length > 0 ? (
          <div className="developer-profile-socials" aria-label="Social media">
            {socialEntries.map(([platform, url]) => {
              const Icon = SOCIAL_ICON[platform];
              if (!Icon) return null;
              return (
                <a key={platform} href={url} target="_blank" rel="noreferrer noopener" aria-label={`Visit us on ${platform}`}>
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        ) : null}

        {formattedOfficeHours.length > 0 ? (
          <div className="developer-profile-hours">
            <p className="developer-profile-hours-title">Hours</p>
            {formattedOfficeHours.map((row) => (
              <p key={row.label}>{row.label} <span>{row.value}</span></p>
            ))}
          </div>
        ) : null}
      </aside>

      <div className="developer-profile-main">
        <div className="developer-profile-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "projects"} className={tab === "projects" ? "active" : undefined} onClick={() => setTab("projects")}>Projects</button>
          <button type="button" role="tab" aria-selected={tab === "awards"} className={tab === "awards" ? "active" : undefined} onClick={() => setTab("awards")}>Awards</button>
          <button type="button" role="tab" aria-selected={tab === "press"} className={tab === "press" ? "active" : undefined} onClick={() => setTab("press")}>Press mentions</button>
        </div>

        {tab === "projects" ? (
          <section className="developer-profile-communities">
            {projects.length === 0 ? (
              <p className="developer-empty-note">No projects link to {company.name} yet.</p>
            ) : (
              <div className="developer-profile-list">
                {projects.map((project) => (
                  <Link href={`/projects/${project.slug}`} key={project.slug} className="developer-profile-row">
                    <div className="developer-profile-row-image">
                      {project.heroImage ? <Image src={project.heroImage} alt={project.name} width={150} height={110} /> : <House size={28} />}
                    </div>
                    <div className="developer-profile-row-body">
                      <h3>{project.name}</h3>
                      <p className="developer-profile-row-price">{project.status === "Coming Soon" ? "Register now" : `From ${formatLkr(project.startingPriceLkr)}`}</p>
                      <p className="developer-profile-row-meta">{project.type} | {project.constructionStatus}</p>
                      <p className="developer-profile-row-address">{project.location}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        ) : tab === "awards" ? (
          <section className="developer-profile-awards">
            {company.awards && company.awards.length > 0 ? (
              <div className="developer-profile-list-plain">
                {company.awards.map((award) => (
                  <div key={award.title} className="developer-profile-award-row">
                    <p className="developer-profile-award-title">{award.title}</p>
                    <p className="developer-profile-award-meta">{[award.issuer, award.year].filter(Boolean).join(" · ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="developer-empty-note">No awards listed yet.</p>
            )}
          </section>
        ) : (
          <section className="developer-profile-press">
            {company.pressMentions && company.pressMentions.length > 0 ? (
              <div className="developer-profile-list-plain">
                {company.pressMentions.map((mention) => (
                  <div key={mention.title} className="developer-profile-press-row">
                    {mention.url ? (
                      <a href={mention.url} target="_blank" rel="noopener noreferrer" className="developer-profile-press-title">{mention.title}</a>
                    ) : (
                      <p className="developer-profile-press-title">{mention.title}</p>
                    )}
                    <p className="developer-profile-press-meta">{[mention.source, mention.date].filter(Boolean).join(" · ")}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="developer-empty-note">No press mentions yet.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

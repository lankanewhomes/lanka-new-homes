"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Heart, House, Star } from "lucide-react";
import type { Developer, Project } from "@/types";
import { formatLkr, formatOfficeHours } from "@/lib/format";
import { SOCIAL_ICON } from "@/components/marketplace/components";
import { useSavedDeveloper } from "@/lib/use-saved-developer";

type Tab = "projects" | "reviews" | "awards" | "press";

export function DeveloperProfileView({ developer, projects }: { developer: Developer; projects: Project[] }) {
  const [tab, setTab] = useState<Tab>("projects");
  const { saved: following, toggle: toggleFollow } = useSavedDeveloper(developer.slug);
  const [locationFilter, setLocationFilter] = useState("all");
  const formattedOfficeHours = formatOfficeHours(developer.officeHours);
  const coDevelopers = (developer.coDevelopers ?? []).filter((entry) => entry.name);
  const socialEntries = Object.entries(developer.socialLinks ?? {}).filter(([, url]) => Boolean(url)) as [string, string][];

  const locations = useMemo(() => Array.from(new Set(projects.map((project) => project.location))).sort(), [projects]);

  const visibleProjects = locationFilter === "all" ? projects : projects.filter((project) => project.location === locationFilter);

  return (
    <div className="developer-profile">
      <aside className="developer-profile-sidebar">
        <div className="developer-profile-logo">
          <div className={developer.logo.startsWith("/") ? "developer-profile-logo-chip" : undefined}>
            <Image src={developer.logo} alt={developer.name} width={220} height={90} />
          </div>
        </div>
        <h1>{developer.name}</h1>
        <p className="developer-profile-role">Developer</p>
        <p className="developer-profile-reviews">0 Reviews</p>
        <button type="button" className="developer-profile-review-button">Write a review <Star size={16} /></button>
        <button
          type="button"
          className={`developer-profile-follow-button${following ? " is-following" : ""}`}
          onClick={toggleFollow}
          aria-pressed={following}
        >
          <Heart size={16} className={following ? "text-[#d94f4f]" : undefined} fill={following ? "#d94f4f" : "none"} />
          {following ? "Following" : "Follow developer"}
        </button>

        <div className="developer-profile-contact">
          <p>{developer.location}</p>
          <p>{developer.phone}</p>
          {developer.website ? <a href={developer.website} target="_blank" rel="noopener noreferrer">{developer.website.replace(/^https?:\/\//, "")}</a> : null}
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

        {coDevelopers.length > 0 ? (
          <div className="developer-profile-co-developers">
            <p className="developer-profile-hours-title">Also built with</p>
            {coDevelopers.map((entry) => (
              <p key={entry.name}>{entry.href ? <Link href={entry.href}>{entry.name}</Link> : entry.name}</p>
            ))}
          </div>
        ) : null}
      </aside>

      <div className="developer-profile-main">
        <div className="developer-profile-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "projects"} className={tab === "projects" ? "active" : undefined} onClick={() => setTab("projects")}>Projects</button>
          <button type="button" role="tab" aria-selected={tab === "reviews"} className={tab === "reviews" ? "active" : undefined} onClick={() => setTab("reviews")}>Reviews</button>
          <button type="button" role="tab" aria-selected={tab === "awards"} className={tab === "awards" ? "active" : undefined} onClick={() => setTab("awards")}>Awards</button>
          <button type="button" role="tab" aria-selected={tab === "press"} className={tab === "press" ? "active" : undefined} onClick={() => setTab("press")}>Press mentions</button>
        </div>

        {tab === "projects" ? (
          <section className="developer-profile-communities">
            {locations.length > 1 ? (
              <div className="developer-profile-communities-head developer-profile-communities-head-filter-only">
                <div className="developer-profile-filter">
                  <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Filter by location">
                    <option value="all">All locations ({projects.length})</option>
                    {locations.map((location) => <option key={location} value={location}>{location}</option>)}
                  </select>
                  <ChevronDown size={16} />
                </div>
              </div>
            ) : null}

            {visibleProjects.length === 0 ? (
              <p className="developer-empty-note">No projects listed yet.</p>
            ) : (
              <div className="developer-profile-list">
                {visibleProjects.map((project) => (
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
        ) : tab === "reviews" ? (
          <section className="developer-profile-reviews">
            <p className="developer-empty-note">No reviews yet. Be the first to share your experience with {developer.name}.</p>
          </section>
        ) : tab === "awards" ? (
          <section className="developer-profile-awards">
            {developer.awards && developer.awards.length > 0 ? (
              <div className="developer-profile-list-plain">
                {developer.awards.map((award) => (
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
            {developer.pressMentions && developer.pressMentions.length > 0 ? (
              <div className="developer-profile-list-plain">
                {developer.pressMentions.map((mention) => (
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

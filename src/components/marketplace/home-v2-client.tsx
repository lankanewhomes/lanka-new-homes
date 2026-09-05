"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import { ArrowRight, Search } from "lucide-react";
import type { Developer, Project } from "@/types";
import { formatLkr } from "@/lib/format";

const display = Fraunces({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-v2-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-v2-body" });

export function HomeV2Client({ projects, developers }: { projects: Project[]; developers: Developer[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const featuredProjects = useMemo(() => {
    const featured = projects.filter((project) => project.isFeatured);
    return (featured.length > 0 ? featured : projects).slice(0, 6);
  }, [projects]);

  const featuredBuilders = useMemo(() => {
    const unique = developers.reduce((map, developer) => {
      const key = developer.name.trim().toLowerCase();
      const current = map.get(key);
      const currentScore = current ? current.activeProjects + current.completedProjects : -1;
      const nextScore = developer.activeProjects + developer.completedProjects;
      if (!current || nextScore > currentScore) map.set(key, developer);
      return map;
    }, new Map<string, Developer>());
    return Array.from(unique.values())
      .sort((a, b) => b.activeProjects + b.completedProjects - (a.activeProjects + a.completedProjects))
      .slice(0, 6);
  }, [developers]);

  const stats = useMemo(
    () => [
      { value: String(projects.length), label: "Verified projects" },
      { value: String(featuredBuilders.length > 0 ? developers.length : 0), label: "Trusted developers" },
      { value: "9", label: "Provinces covered" },
    ],
    [projects.length, developers.length, featuredBuilders.length],
  );

  const onSubmitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchTerm.trim();
    window.location.href = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
  };

  return (
    <div className={`homev2 ${display.variable} ${body.variable}`}>
      <section className="homev2-hero">
        <div className="homev2-hero-image">
          {featuredProjects[0]?.heroImage ? (
            <Image src={featuredProjects[0].heroImage} alt="" fill priority sizes="100vw" className="homev2-hero-img" />
          ) : null}
          <div className="homev2-hero-scrim" />
        </div>

        <div className="homev2-hero-content">
          <p className="homev2-eyebrow">Sri Lanka, reconsidered</p>
          <h1 className="homev2-hero-title">
            A home that <em>waits</em>
            <br />
            for no one else.
          </h1>
          <p className="homev2-hero-sub">
            The island&rsquo;s new developments, curated — not just listed. Real pricing, real availability, straight from the developers building them.
          </p>

          <form className="homev2-search" onSubmit={onSubmitSearch}>
            <Search size={18} strokeWidth={1.5} aria-hidden="true" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Try “sea view in Galle” or “Colombo 07”"
              aria-label="Search new homes"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="homev2-stats" aria-label="At a glance">
        {stats.map((stat) => (
          <div key={stat.label} className="homev2-stat">
            <p className="homev2-stat-value">{stat.value}</p>
            <p className="homev2-stat-label">{stat.label}</p>
          </div>
        ))}
      </section>

      <section className="homev2-section" aria-label="Featured listings">
        <div className="homev2-section-head">
          <div>
            <p className="homev2-eyebrow">Handpicked</p>
            <h2>Listings worth a second look</h2>
          </div>
          <Link href="/search" className="homev2-textlink">
            View every listing <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
          </Link>
        </div>

        <div className="homev2-rail">
          {featuredProjects.map((project, index) => (
            <Link
              key={project.slug}
              href={`/projects/${project.slug}`}
              className={`homev2-card${index === 0 ? " homev2-card-lead" : ""}`}
            >
              <div className="homev2-card-image">
                {project.heroImage ? <Image src={project.heroImage} alt={project.name} fill sizes="(max-width: 760px) 90vw, 420px" /> : null}
              </div>
              <div className="homev2-card-body">
                <p className="homev2-card-kicker">{project.type} · {project.status}</p>
                <h3>{project.name}</h3>
                <p className="homev2-card-location">{[project.location, project.city].filter(Boolean).join(", ")}</p>
                <p className="homev2-card-price">From {formatLkr(project.startingPriceLkr)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {featuredBuilders.length > 0 ? (
        <section className="homev2-section homev2-builders" aria-label="Featured developers">
          <div className="homev2-section-head">
            <div>
              <p className="homev2-eyebrow">Who&rsquo;s building it</p>
              <h2>Developers behind the island&rsquo;s best addresses</h2>
            </div>
            <Link href="/developers" className="homev2-textlink">
              Meet every developer <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
            </Link>
          </div>

          <div className="homev2-builder-grid">
            {featuredBuilders.map((developer) => (
              <Link key={developer.slug} href={`/developers/${developer.slug}`} className="homev2-builder-card">
                <Image src={developer.logo} alt={developer.name} width={96} height={96} />
                <span>{developer.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="homev2-cta">
        <h2>
          Ready to see what&rsquo;s <em>actually</em> available?
        </h2>
        <Link href="/projects" className="homev2-cta-button">
          Browse all new homes
        </Link>
      </section>
    </div>
  );
}

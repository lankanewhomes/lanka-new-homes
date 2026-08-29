"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BedDouble, ChevronDown, Heart, List, Map as MapIcon, Ruler, Search } from "lucide-react";
import { formatLkr } from "@/lib/format";
import { useSavedListing } from "@/lib/use-saved-listing";
import type { Project } from "@/types";

const LazyMapPane = dynamic(() => import("@/components/marketplace/map-pane").then((mod) => mod.MapPane), {
  ssr: false,
  loading: () => <div className="listing-map-loading" aria-hidden="true">Loading map…</div>,
});

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "priceAsc", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
] as const;

type SortValue = typeof SORT_OPTIONS[number]["value"];
type ViewMode = "split" | "list" | "map";

const FILTER_GROUPS = [
  { label: "For sale", options: ["For sale", "Any"] },
  { label: "Home type", options: ["Any", "Condominium", "Apartments", "Villas", "Townhouse", "Housing"] },
  { label: "Any price", options: ["Any price", "Under Rs. 30M", "Rs. 30M - 60M", "Rs. 60M+"] },
  { label: "0+ beds", options: ["0+ beds", "1+", "2+", "3+", "4+"] },
  { label: "Construction status", options: ["Any", "Now Selling", "Coming Soon", "Under Construction", "Nearly Complete"] },
];

function statusPillLabel(project: Project) {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return "Preconstruction";
  if (project.isMoveInNow) return "Move In Now";
  if (project.completionYear) return `Move In ${project.completionYear}`;
  return project.status;
}

export function ListingGridCard({ project }: { project: Project }) {
  const { saved, toggle } = useSavedListing(project.slug);
  const hasPrice = project.startingPriceLkr > 0;

  return (
    <article className="listing-grid-card">
      <Link href={`/projects/${project.slug}`} className="listing-grid-card-media">
        <Image
          src={project.heroImage}
          alt={`${project.name} in ${project.location}`}
          width={480}
          height={340}
          className="listing-grid-card-image"
        />
        <span className="listing-grid-card-status">{statusPillLabel(project)}</span>
        <button
          type="button"
          className={`listing-grid-card-save${saved ? " saved" : ""}`}
          aria-label={saved ? `Remove ${project.name} from saved` : `Save ${project.name}`}
          onClick={(event) => {
            event.preventDefault();
            toggle();
          }}
        >
          <Heart className="h-4 w-4" aria-hidden="true" fill={saved ? "currentColor" : "none"} />
        </button>
        {project.isFeatured ? <span className="listing-grid-card-featured">Featured</span> : null}
      </Link>

      <div className="listing-grid-card-body">
        <Link href={`/projects/${project.slug}`} className="listing-grid-card-name">{project.name}</Link>
        <p className="listing-grid-card-price">{hasPrice ? `From ${formatLkr(project.startingPriceLkr)}` : project.status}</p>
        <p className="listing-grid-card-developer">{project.type} by {project.developerName}</p>
        <p className="listing-grid-card-address">{project.location}</p>
        {project.ownership && project.ownership !== "-" ? <p className="listing-grid-card-ownership">{project.ownership}</p> : null}
        {(project.bedrooms && project.bedrooms !== "-") || (project.floorAreaRange && project.floorAreaRange !== "-") ? (
          <div className="listing-grid-card-facts">
            {project.bedrooms && project.bedrooms !== "-" ? (
              <span><BedDouble className="h-3.5 w-3.5" aria-hidden="true" /> {project.bedrooms} bd</span>
            ) : null}
            {project.floorAreaRange && project.floorAreaRange !== "-" ? (
              <span><Ruler className="h-3.5 w-3.5" aria-hidden="true" /> {project.floorAreaRange} SqFt</span>
            ) : null}
          </div>
        ) : (
          <p className="listing-grid-card-facts-empty">Floorplans not yet available</p>
        )}
      </div>
    </article>
  );
}

export function ListingPageBody({ projects, h1, eyebrow, intro }: { projects: Project[]; h1: string; eyebrow: string; intro: string }) {
  const [sortBy, setSortBy] = useState<SortValue>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  const sortedProjects = useMemo(() => {
    const list = [...projects];
    if (sortBy === "priceAsc") list.sort((a, b) => a.startingPriceLkr - b.startingPriceLkr);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.startingPriceLkr - a.startingPriceLkr);
    else if (sortBy === "newest") list.sort((a, b) => (b.launchDate ?? "").localeCompare(a.launchDate ?? ""));
    return list;
  }, [projects, sortBy]);

  return (
    <div className="listing-page">
      <div className="listing-filter-bar" role="group" aria-label="Search filters">
        {FILTER_GROUPS.map((group) => (
          <label key={group.label} className="listing-filter-pill">
            <span>{group.options[0]}</span>
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            <select defaultValue={group.options[0]} aria-label={group.label}>
              {group.options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        ))}
        <button type="button" className="listing-filter-pill listing-filter-pill-more">
          More <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </button>

        <div className="listing-filter-bar-actions">
          <button type="button" className="listing-pill-button">
            <Heart className="h-4 w-4" aria-hidden="true" /> Save search
          </button>
          <div className="listing-view-toggle" role="group" aria-label="Switch between list and map view">
            <button type="button" className={viewMode === "list" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "list" ? "split" : "list"))} aria-pressed={viewMode === "list"}>
              <List className="h-4 w-4" aria-hidden="true" /> List
            </button>
            <button type="button" className={viewMode === "map" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))} aria-pressed={viewMode === "map"}>
              <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
            </button>
          </div>
        </div>
      </div>

      <div className="listing-header-row">
        <div>
          <p className="listing-header-eyebrow"><Search className="h-3.5 w-3.5" aria-hidden="true" /> {sortedProjects.length} {eyebrow}</p>
          <h1 className="listing-header-h1">{h1}</h1>
          <p className="listing-header-intro">{intro}</p>
        </div>
        <label className="listing-sort-select">
          <span>Sort:</span>
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="listing-columns" data-view={viewMode}>
        <div className="listing-list-pane">
          {sortedProjects.length > 0 ? (
            <div className="listing-grid">
              {sortedProjects.map((project) => (
                <ListingGridCard key={project.slug} project={project} />
              ))}
            </div>
          ) : (
            <p className="listing-empty-state">No projects match this page yet — check back soon, or browse all new projects in Sri Lanka.</p>
          )}
        </div>
        <div className="listing-map-pane">
          <button
            type="button"
            className="listing-map-collapse"
            aria-label={viewMode === "map" ? "Show list" : "Show map only"}
            onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))}
          >
            {viewMode === "map" ? "›" : "‹"}
          </button>
          <LazyMapPane projects={sortedProjects} />
        </div>
      </div>
    </div>
  );
}

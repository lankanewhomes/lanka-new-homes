"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Heart, List, Map as MapIcon, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { formatLkr } from "@/lib/format";
import { useSavedListing } from "@/lib/use-saved-listing";
import type { Project } from "@/types";
import type { MapAreaSelection } from "@/components/marketplace/map-pane";

const LazyMapPane = dynamic(() => import("@/components/marketplace/map-pane").then((mod) => mod.MapPane), {
  ssr: false,
  loading: () => <div className="listing-map-loading" aria-hidden="true">Loading map…</div>,
});

const SORT_OPTIONS = [
  { value: "featured", label: "Recommended" },
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

export function ListingGridCard({ project, basePath = "/projects" }: { project: Project; basePath?: string }) {
  const { saved, toggle } = useSavedListing(project.slug);
  const hasPrice = project.startingPriceLkr > 0;
  const href = `${basePath}/${project.slug}`;
  const photos = project.gallery.length > 0 ? project.gallery.map((item) => item.image) : [project.heroImage];
  const [photoIndex, setPhotoIndex] = useState(0);

  const showPrevPhoto = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPhotoIndex((index) => (index - 1 + photos.length) % photos.length);
  };

  const showNextPhoto = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setPhotoIndex((index) => (index + 1) % photos.length);
  };

  return (
    <article className="listing-grid-card">
      <Link href={href} className="listing-grid-card-media">
        <Image
          src={photos[photoIndex]}
          alt={`${project.name} in ${project.location}`}
          width={480}
          height={340}
          className="listing-grid-card-image"
        />
        <span className="listing-grid-card-status">{statusPillLabel(project)}</span>
        {project.isFeatured ? <span className="listing-grid-card-featured">Featured</span> : null}

        {photos.length > 1 ? (
          <>
            <button type="button" className="listing-grid-card-carousel-arrow left" onClick={showPrevPhoto} aria-label="Previous photo">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" className="listing-grid-card-carousel-arrow right" onClick={showNextPhoto} aria-label="Next photo">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="listing-grid-card-counter">{photoIndex + 1}/{photos.length}</span>
          </>
        ) : null}
      </Link>

      <div className="listing-grid-card-body">
        <Link href={href} className="listing-grid-card-name">{project.name}</Link>
        <p className="listing-grid-card-facts-line">
          {project.type}
          {project.bedrooms && project.bedrooms !== "-" ? <> · {project.bedrooms} bd</> : null}
          {project.floorAreaRange && project.floorAreaRange !== "-" ? <> · {project.floorAreaRange} SqFt</> : null}
        </p>
        <p className="listing-grid-card-address"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {project.location}</p>
        <p className="listing-grid-card-agency">Listed by {project.developerName}</p>

        <div className="listing-grid-card-bottom-row">
          <p className="listing-grid-card-price">{hasPrice ? `From ${formatLkr(project.startingPriceLkr)}` : project.status}</p>
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
        </div>
      </div>
    </article>
  );
}

export function ListingPageBody({
  projects,
  h1,
  eyebrow,
  singularEyebrow,
  intro,
  basePath = "/projects",
  filterGroups = FILTER_GROUPS,
  emptyStateText = "No projects match this page yet — check back soon, or browse all new projects in Sri Lanka.",
}: {
  projects: Project[];
  h1: string;
  eyebrow: string;
  /** Singular form used in the dynamic "There is 1 {noun} for sale in..."
   * heading (shown when a map cluster is selected) — falls back to the
   * plural form if not given, since not every caller needs it exact. */
  singularEyebrow?: string;
  intro: string;
  basePath?: string;
  filterGroups?: { label: string; options: string[] }[];
  emptyStateText?: string;
}) {
  const [sortBy, setSortBy] = useState<SortValue>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedArea, setSelectedArea] = useState<MapAreaSelection>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // A typed location search takes priority over a map-cluster selection —
  // both drive the same "There are N {noun} for sale in {label}" heading
  // and list filter, they just come from different inputs.
  const searchMatch = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!searchMatch) return null;
    return projects.filter((project) => `${project.city} ${project.location} ${project.district}`.toLowerCase().includes(searchMatch));
  }, [projects, searchMatch]);

  const activeSelection = searchResults ? { label: searchQuery.trim(), projects: searchResults } : selectedArea;
  const baseProjects = activeSelection ? activeSelection.projects : projects;

  const sortedProjects = useMemo(() => {
    const list = [...baseProjects];
    if (sortBy === "priceAsc") list.sort((a, b) => a.startingPriceLkr - b.startingPriceLkr);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.startingPriceLkr - a.startingPriceLkr);
    else if (sortBy === "newest") list.sort((a, b) => (b.launchDate ?? "").localeCompare(a.launchDate ?? ""));
    return list;
  }, [baseProjects, sortBy]);

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? SORT_OPTIONS[0].label;

  return (
    <div className="listing-page">
      <div className="listing-search-bar">
        <label className="listing-search-input-wrap">
          <input
            type="text"
            placeholder="Enter a location, city, or district"
            aria-label="Search by location"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <span className="listing-search-icon-btn">
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
          {searchQuery ? (
            <button type="button" className="listing-search-clear" aria-label="Clear search" onClick={() => setSearchQuery("")}>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </label>

        <div className={`listing-filter-pills-center${mobileFiltersOpen ? " is-open" : ""}`}>
          {filterGroups.map((group) => (
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
        </div>

        <div className="listing-view-toggle" role="group" aria-label="Switch between list and map view">
          <button type="button" className={viewMode === "list" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "list" ? "split" : "list"))} aria-pressed={viewMode === "list"}>
            <List className="h-4 w-4" aria-hidden="true" /> List
          </button>
          <button type="button" className={viewMode === "map" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))} aria-pressed={viewMode === "map"}>
            <MapIcon className="h-4 w-4" aria-hidden="true" /> Map
          </button>
        </div>
      </div>

      <div className="listing-content-shade">
        <div className="listing-header-row">
          <label className="listing-sort-pill">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{sortLabel}</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)} aria-label="Sort projects">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          {/* Mobile-only compact toolbar — replaces the sprawling filter
              pill row + List/Map text toggle with two icon buttons once
              the search bar wraps to a single column. */}
          <div className="listing-mobile-actions">
            <button
              type="button"
              className="listing-mobile-icon-btn"
              aria-label={viewMode === "map" ? "Show list" : "Show map"}
              aria-pressed={viewMode === "map"}
              onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))}
            >
              <MapIcon className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="listing-mobile-icon-btn"
              aria-label="Filters"
              aria-expanded={mobileFiltersOpen}
              onClick={() => setMobileFiltersOpen((v) => !v)}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {activeSelection ? (
          <h1 className="listing-header-h1 listing-header-h1-dynamic">
            There {sortedProjects.length === 1 ? "is" : "are"} {sortedProjects.length} {sortedProjects.length === 1 ? (singularEyebrow ?? eyebrow) : eyebrow} for sale in {activeSelection.label}
          </h1>
        ) : (
          <h1 className="listing-header-h1">{h1}</h1>
        )}

        <div className="listing-columns" data-view={viewMode}>
          <div className="listing-list-pane">
            {sortedProjects.length > 0 ? (
              <div className="listing-grid">
                {sortedProjects.map((project) => (
                  <ListingGridCard key={project.slug} project={project} basePath={basePath} />
                ))}
              </div>
            ) : (
              <p className="listing-empty-state">{emptyStateText}</p>
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
            {/* Always shows every pin (not the area-filtered sortedProjects) —
                only the card list/heading filter when a cluster is selected,
                so clicking a pin doesn't reshuffle the map's own pins. */}
            <LazyMapPane projects={projects} basePath={basePath} onSelectArea={setSelectedArea} />
          </div>
        </div>
      </div>
    </div>
  );
}

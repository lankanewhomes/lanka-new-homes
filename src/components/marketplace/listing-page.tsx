"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BedDouble, ChevronDown, ChevronLeft, ChevronRight, Heart, List, Map as MapIcon, Ruler, Search, MapPin, SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { formatLkr } from "@/lib/format";
import { useSavedListing } from "@/lib/use-saved-listing";
import { MapSidebar } from "@/components/marketplace/map-sidebar";
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

function matchesFilters(project: Project, selections: Record<string, string>): boolean {
  for (const [label, value] of Object.entries(selections)) {
    if (!value) continue;
    switch (label) {
      case "Home type":
      case "Land use":
        if (value !== "Any" && project.type !== value) return false;
        break;
      case "Any price": {
        if (value === "Any price") break;
        const price = project.startingPriceLkr;
        if (value === "Under Rs. 30M" && !(price > 0 && price < 30_000_000)) return false;
        if (value === "Rs. 30M - 60M" && !(price >= 30_000_000 && price <= 60_000_000)) return false;
        if (value === "Rs. 60M+" && !(price > 60_000_000)) return false;
        if (value === "Under Rs. 10M" && !(price > 0 && price < 10_000_000)) return false;
        if (value === "Rs. 10M - 30M" && !(price >= 10_000_000 && price <= 30_000_000)) return false;
        if (value === "Rs. 30M+" && !(price > 30_000_000)) return false;
        break;
      }
      case "0+ beds": {
        if (value === "0+ beds") break;
        const min = parseInt(value, 10);
        const beds = parseInt(project.bedrooms, 10);
        if (!Number.isNaN(min) && (Number.isNaN(beds) || beds < min)) return false;
        break;
      }
      case "Construction status":
      case "Status":
        if (value !== "Any" && project.status !== value) return false;
        break;
      case "Any size": {
        if (value === "Any size") break;
        const perches = parseFloat(project.floorAreaRange);
        if (value === "Under 20 perches" && !(perches > 0 && perches < 20)) return false;
        if (value === "20 - 50 perches" && !(perches >= 20 && perches <= 50)) return false;
        if (value === "50+ perches" && !(perches > 50)) return false;
        break;
      }
      case "For sale":
        break;
    }
  }
  return true;
}

function statusPillLabel(project: Project) {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return "Preconstruction";
  if (project.isMoveInNow) return "Move In Now";
  if (project.completionYear) return `Move In ${project.completionYear}`;
  return project.status;
}

export function ListingGridCard({ project, basePath = "/projects" }: { project: Project; basePath?: string }) {
  const { saved, toggle } = useSavedListing(project.slug);
  const isLand = basePath === "/land";
  const hasPrice = project.startingPriceLkr > 0;
  const hasLandSize = project.floorAreaRange && project.floorAreaRange !== "-";
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
        {project.isFeatured ? (
          <div className="home-card-badge-row">
            <span className="badge-featured">Featured</span>
          </div>
        ) : null}
        <Link href={href} className="listing-grid-card-name">{project.name}</Link>
        <p className="listing-grid-card-price">
          {isLand
            ? (hasLandSize ? `From ${project.floorAreaRange}` : project.status)
            : (hasPrice ? `From ${formatLkr(project.startingPriceLkr)}` : project.status)}
        </p>
        <p className="listing-grid-card-agency">{project.developerName}</p>
        <p className="listing-grid-card-address">{project.location}</p>

        <div className="listing-grid-card-facts-row">
          {isLand ? (
            <span className="listing-grid-card-fact">
              <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
              {project.units > 0 ? `${project.units} plot${project.units === 1 ? "" : "s"}` : "—"}
            </span>
          ) : (
            <span className="listing-grid-card-fact">
              <BedDouble className="h-3.5 w-3.5" aria-hidden="true" />
              {project.bedrooms && project.bedrooms !== "-" ? `${project.bedrooms} bd` : "—"}
            </span>
          )}
          <span className="listing-grid-card-fact-divider">|</span>
          <span className="listing-grid-card-fact">
            <Ruler className="h-3.5 w-3.5" aria-hidden="true" />
            {isLand
              ? (hasLandSize ? project.floorAreaRange : "—")
              : (project.floorAreaRange && project.floorAreaRange !== "-" ? `${project.floorAreaRange} SqFt` : "—")}
          </span>
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
  citySectionHeading,
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
  citySectionHeading?: string;
}) {
  const [sortBy, setSortBy] = useState<SortValue>("featured");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [selectedArea, setSelectedArea] = useState<MapAreaSelection>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [filterSelections, setFilterSelections] = useState<Record<string, string>>({});
  const [regionFilter, setRegionFilter] = useState("All of Sri Lanka");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get("q")?.trim() ?? "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchQuery(query);
    const city = params.get("city")?.trim();
    if (city) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRegionFilter(city);
    }
  }, []);

  const cityOptions = useMemo(() => {
    const cities = Array.from(new Set(projects.map((project) => project.city).filter(Boolean)));
    return ["All of Sri Lanka", ...cities.sort()];
  }, [projects]);

  const activeSelection = selectedArea;
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const regionFilteredProjects = useMemo(() => {
    let list = regionFilter === "All of Sri Lanka" ? projects : projects.filter((project) => project.city === regionFilter);
    if (trimmedQuery) {
      list = list.filter((project) =>
        project.name.toLowerCase().includes(trimmedQuery) ||
        project.location.toLowerCase().includes(trimmedQuery) ||
        project.city.toLowerCase().includes(trimmedQuery) ||
        project.district.toLowerCase().includes(trimmedQuery)
      );
    }
    list = list.filter((project) => matchesFilters(project, filterSelections));
    return list;
  }, [projects, regionFilter, trimmedQuery, filterSelections]);
  const baseProjects = activeSelection ? activeSelection.projects : regionFilteredProjects;
  const searchPlaceLabel = trimmedQuery ? searchQuery.trim() : regionFilter !== "All of Sri Lanka" ? regionFilter : null;

  const sortedProjects = useMemo(() => {
    const list = [...baseProjects];
    if (sortBy === "priceAsc") list.sort((a, b) => a.startingPriceLkr - b.startingPriceLkr);
    else if (sortBy === "priceDesc") list.sort((a, b) => b.startingPriceLkr - a.startingPriceLkr);
    else if (sortBy === "newest") list.sort((a, b) => (b.launchDate ?? "").localeCompare(a.launchDate ?? ""));
    return list;
  }, [baseProjects, sortBy]);

  const sortLabel = SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? SORT_OPTIONS[0].label;

  const filterPanel = moreFiltersOpen ? (
    <>
      <button type="button" className="listing-filter-more-scrim" aria-label="Close filters" onClick={() => setMoreFiltersOpen(false)} />
      <div className="listing-filter-more-panel" role="dialog" aria-modal="true" aria-label="More filters">
        <div className="listing-filter-more-head">
          <p>Filters</p>
          <button type="button" aria-label="Close" onClick={() => setMoreFiltersOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        {filterGroups.map((group) => (
          <div key={group.label} className="listing-filter-more-group">
            <p className="listing-filter-more-group-label">{group.label}</p>
            <div className="listing-filter-more-options">
              {group.options.map((option) => (
                <label key={option} className="listing-filter-more-option">
                  <input
                    type="radio"
                    name={`listing-more-${group.label}`}
                    checked={(filterSelections[group.label] ?? group.options[0]) === option}
                    onChange={() => setFilterSelections((prev) => ({ ...prev, [group.label]: option }))}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <div className="listing-filter-more-actions">
          <button type="button" className="listing-filter-more-reset" onClick={() => setFilterSelections({})}>Reset filters</button>
          <button type="button" className="listing-filter-more-apply" onClick={() => setMoreFiltersOpen(false)}>View results</button>
        </div>
      </div>
    </>
  ) : null;

  return (
    <>
      <MapSidebar basePath={basePath} />
      <div className="listing-page">
        <div className="listing-content-shade" data-view={viewMode}>
          <div className="listing-search-bar">
            <div className="listing-search-input-wrap">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by location, project name..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <button type="button" className="listing-search-clear" onClick={() => setSearchQuery("")} aria-label="Clear search">
                  &times;
                </button>
              ) : null}
            </div>

            <label className="listing-region-picker">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {regionFilter}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
              <select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)} aria-label="Filter by city">
                {cityOptions.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </label>

            <button type="button" className="listing-search-icon-btn" aria-label="Search">
              <Search className="h-4 w-4" />
            </button>

            <div className="listing-filter-pills-center">
              {filterGroups.map((group) => (
                <label key={group.label} className="listing-filter-pill">
                  {filterSelections[group.label] && filterSelections[group.label] !== group.options[0] ? filterSelections[group.label] : group.label}
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                  <select
                    value={filterSelections[group.label] ?? group.options[0]}
                    onChange={(event) => setFilterSelections((prev) => ({ ...prev, [group.label]: event.target.value }))}
                  >
                    {group.options.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              ))}

              <div className="listing-filter-more-wrap listing-filter-more-wrap--desktop">
                <button type="button" className="listing-filter-pill-more" onClick={() => setMoreFiltersOpen((v) => !v)} aria-label="More filters" aria-expanded={moreFiltersOpen}>
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                {filterPanel}
              </div>
            </div>

            <div className="listing-filter-bar-actions listing-filter-bar-actions--desktop">
              <div className="listing-view-toggle" role="group" aria-label="Switch between list and map view">
                <button type="button" className={viewMode === "list" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "list" ? "split" : "list"))} aria-pressed={viewMode === "list"}>
                  <List className="h-4 w-4" aria-hidden="true" /> <span className="listing-view-toggle-label">List</span>
                </button>
                <button type="button" className={viewMode === "map" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))} aria-pressed={viewMode === "map"}>
                  <MapIcon className="h-4 w-4" aria-hidden="true" /> <span className="listing-view-toggle-label">Map</span>
                </button>
              </div>
            </div>
          </div>

          <div className="listing-filter-sticky">
            <div className="listing-filter-sticky-top">
              <div className="listing-filter-sticky-left">
                <div className="listing-filter-more-wrap listing-filter-more-wrap--mobile">
                  <button type="button" className="listing-filter-pill-more" onClick={() => setMoreFiltersOpen((v) => !v)} aria-label="More filters" aria-expanded={moreFiltersOpen}>
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                  {filterPanel}
                </div>

                <label className="listing-sort-pill listing-sort-pill--mobile">
                  <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                  <span className="listing-sort-pill-label">Sort</span>
                  <span className="listing-sort-pill-value">{sortLabel}</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)} aria-label="Sort projects">
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="listing-view-toggle" role="group" aria-label="Switch between list and map view">
                <button type="button" className={viewMode === "list" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "list" ? "split" : "list"))} aria-pressed={viewMode === "list"}>
                  <List className="h-4 w-4" aria-hidden="true" /> <span className="listing-view-toggle-label">List</span>
                </button>
                <button type="button" className={viewMode === "map" ? "active" : undefined} onClick={() => setViewMode((v) => (v === "map" ? "split" : "map"))} aria-pressed={viewMode === "map"}>
                  <MapIcon className="h-4 w-4" aria-hidden="true" /> <span className="listing-view-toggle-label">Map</span>
                </button>
              </div>
            </div>

            <div className="listing-header-title">
              {!activeSelection && !trimmedQuery && regionFilter !== "All of Sri Lanka" ? (
                <h1 className="listing-header-h1 listing-header-h1-dynamic">New developments in {regionFilter}</h1>
              ) : activeSelection || searchPlaceLabel ? (
                <h1 className="listing-header-h1 listing-header-h1-dynamic">
                  There {sortedProjects.length === 1 ? "is" : "are"} {sortedProjects.length.toLocaleString()} {sortedProjects.length === 1 ? (singularEyebrow ?? eyebrow) : eyebrow} for sale in {activeSelection ? activeSelection.label : searchPlaceLabel}
                </h1>
              ) : (
                <h1 className="listing-header-h1">{h1}</h1>
              )}
              <p className="listing-header-count">
                {sortedProjects.length > 0 ? `1-${sortedProjects.length.toLocaleString()} of ${projects.length.toLocaleString()}` : `0 of ${projects.length.toLocaleString()}`} {basePath === "/land" ? "Lands" : "Homes"}
              </p>
            </div>
          </div>

          {citySectionHeading ? (
            <div className="listing-city-subhead-wrap">
              <h2 className="listing-city-subhead">{citySectionHeading}</h2>
            </div>
          ) : null}

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
    </>
  );
}

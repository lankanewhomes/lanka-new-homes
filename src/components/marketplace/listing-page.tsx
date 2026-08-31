"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { BedDouble, ChevronDown, ChevronLeft, ChevronRight, Heart, List, Map as MapIcon, Ruler } from "lucide-react";
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

  const activeSelection = selectedArea;
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
    <>
      <MapSidebar basePath={basePath} />
      <div className="listing-page">
        <div className="listing-content-shade" data-view={viewMode}>
          <div className="listing-columns" data-view={viewMode}>
            <div className="listing-list-pane">
              <div className="listing-header-row">
                {activeSelection ? (
                  <h1 className="listing-header-h1 listing-header-h1-dynamic">
                    There {sortedProjects.length === 1 ? "is" : "are"} {sortedProjects.length} {sortedProjects.length === 1 ? (singularEyebrow ?? eyebrow) : eyebrow} for sale in {activeSelection.label}
                  </h1>
                ) : (
                  <h1 className="listing-header-h1">{h1}</h1>
                )}

                <div className="listing-header-row-right">
                  <label className="listing-sort-pill">
                    <span className="listing-sort-pill-label">Sort:</span>
                    <span>{sortLabel}</span>
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortValue)} aria-label="Sort projects">
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

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

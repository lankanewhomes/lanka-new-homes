"use client";

import { BedDouble, Building2, MapPin, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { ExplorerMap, type MapView } from "@/components/marketplace/explorer-map";
import { ListingGridCard } from "@/components/marketplace/listing-page";
import { ProjectPopup } from "@/components/map/ProjectPopup";
import { bedroomsMatch, typeMatches } from "@/lib/natural-search";
import type { Project } from "@/types";

// Lanka360: the listing map (3D / normal view, city bubbles that zoom in when clicked) with the listings beside it as the same
// cards used on /search. Zooming the map moves the listings in view to the top of the list. No strip of listings under the map.

const PRICE_BANDS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under Rs. 20M", min: 1, max: 20_000_000 },
  { label: "Rs. 20M – 50M", min: 20_000_000, max: 50_000_000 },
  { label: "Rs. 50M – 100M", min: 50_000_000, max: 100_000_000 },
  { label: "Rs. 100M+", min: 100_000_000, max: Infinity },
];
const BED_OPTIONS = ["Any bedrooms", "1", "2", "3", "4+"];

function statusLabel(project: Project): string {
  if (project.status === "Coming Soon" || project.status === "Launching Soon") return "Preconstruction";
  if (project.isMoveInNow) return "Move In Now";
  if (project.completionYear >= new Date().getFullYear()) return `Move In ${project.completionYear}`;
  return project.status;
}

function FilterSelect({ icon, value, options, onChange, label }: { icon?: React.ReactNode; value: string; options: string[]; onChange: (value: string) => void; label: string }) {
  return (
    <label className="l360-filter">
      {icon}
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

const hasPosition = (project: Project) => Number.isFinite(project.coordinates?.lat) && Number.isFinite(project.coordinates?.lng) && !(project.coordinates.lat === 0 && project.coordinates.lng === 0);

export function Lanka360Client({ projects }: { projects: Project[] }) {
  const [city, setCity] = useState("All cities");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("Any status");
  const [beds, setBeds] = useState(BED_OPTIONS[0]);
  const [price, setPrice] = useState(PRICE_BANDS[0].label);
  const [pickedSlug, setPickedSlug] = useState<string | null>(null);
  const [view, setView] = useState<MapView | null>(null);

  const cityOptions = useMemo(() => ["All cities", ...Array.from(new Set(projects.map((p) => p.city).filter(Boolean))).sort()], [projects]);
  const typeOptions = useMemo(() => ["All types", ...Array.from(new Set(projects.map((p) => p.type).filter(Boolean))).sort()], [projects]);
  const statusOptions = useMemo(() => ["Any status", ...Array.from(new Set(projects.map(statusLabel))).sort()], [projects]);

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.label === price) ?? PRICE_BANDS[0];
    const bedMin = beds === "Any bedrooms" ? undefined : parseInt(beds, 10);
    const bedMax = beds === "Any bedrooms" ? undefined : beds.endsWith("+") ? undefined : parseInt(beds, 10);
    return projects.filter((p) => {
      if (city !== "All cities" && p.city !== city) return false;
      if (type !== "All types" && !typeMatches(p.type, type)) return false;
      if (status !== "Any status" && statusLabel(p) !== status) return false;
      if (bedMin !== undefined && !bedroomsMatch(p, bedMin, bedMax)) return false;
      if (band.label !== "Any price" && !(p.startingPriceLkr >= band.min && p.startingPriceLkr < band.max)) return false;
      return true;
    });
  }, [projects, city, type, status, beds, price]);

  const mapItems = useMemo(
    () => filtered.filter(hasPosition).map((p) => ({ slug: p.slug, name: p.name, city: p.city || p.location || "Sri Lanka", lat: p.coordinates.lat, lng: p.coordinates.lng, price: p.startingPriceLkr > 0 ? p.startingPriceLkr : 0 })),
    [filtered],
  );
  const fitKey = useMemo(() => mapItems.map((item) => item.slug).join("|"), [mapItems]);

  // Once the visitor zooms in (a bubble click or a scroll-zoom), the listings in view lead the list.
  const split = useMemo(() => {
    if (!view?.zoomed) return null;
    const inside = (p: Project) => hasPosition(p) && p.coordinates.lng >= view.west && p.coordinates.lng <= view.east && p.coordinates.lat >= view.south && p.coordinates.lat <= view.north;
    return { here: filtered.filter(inside), rest: filtered.filter((p) => !inside(p)) };
  }, [view, filtered]);

  const reset = () => {
    setCity("All cities");
    setType("All types");
    setStatus("Any status");
    setBeds(BED_OPTIONS[0]);
    setPrice(PRICE_BANDS[0].label);
    setPickedSlug(null);
  };
  const filtersActive = city !== "All cities" || type !== "All types" || status !== "Any status" || beds !== BED_OPTIONS[0] || price !== PRICE_BANDS[0].label;

  return (
    <main className="l360">
      <div className="l360-head">
        <h1>Lanka360</h1>
        <p>Explore new projects on a 3D map. Click a city to zoom in and see its listings.</p>
      </div>

      <div className="l360-filters" role="group" aria-label="Filters">
        <FilterSelect icon={<MapPin size={15} aria-hidden="true" />} value={city} options={cityOptions} onChange={setCity} label="City" />
        <FilterSelect icon={<Building2 size={15} aria-hidden="true" />} value={type} options={typeOptions} onChange={setType} label="Property type" />
        <FilterSelect value={status} options={statusOptions} onChange={setStatus} label="Status" />
        <FilterSelect icon={<BedDouble size={15} aria-hidden="true" />} value={beds} options={BED_OPTIONS} onChange={setBeds} label="Bedrooms" />
        <FilterSelect value={price} options={PRICE_BANDS.map((b) => b.label)} onChange={setPrice} label="Price" />
        {filtersActive ? <button type="button" className="l360-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset</button> : null}
        <span className="l360-count">{filtered.length} of {projects.length} projects</span>
      </div>

      <div className="l360-split">
        <div className="l360-listpane">
          {filtered.length === 0 ? (
            <p className="listing-empty-state">No projects match these filters. <button type="button" className="l360-linkbtn" onClick={reset}>Reset filters</button></p>
          ) : (
            <div className="l360-listgrid">
              {split && split.here.length > 0 && split.rest.length > 0 ? (
                <>
                  <h2 className="listing-area-heading">In this map area<span>{split.here.length}</span></h2>
                  {split.here.map((p) => <ListingGridCard key={p.slug} project={p} />)}
                  <h2 className="listing-area-heading">More listings<span>{split.rest.length}</span></h2>
                  {split.rest.map((p) => <ListingGridCard key={p.slug} project={p} />)}
                </>
              ) : (
                filtered.map((p) => <ListingGridCard key={p.slug} project={p} />)
              )}
            </div>
          )}
        </div>

        <div className="l360-mapwrap">
          <ExplorerMap
            items={mapItems}
            fitKey={fitKey}
            defaultTilt
            selectedSlug={pickedSlug}
            onSelect={setPickedSlug}
            onViewChange={setView}
            renderPopup={(slug, close) => {
              const project = projects.find((p) => p.slug === slug);
              return project ? <ProjectPopup project={project} basePath="/projects" onClose={close} /> : null;
            }}
          />
        </div>
      </div>
    </main>
  );
}

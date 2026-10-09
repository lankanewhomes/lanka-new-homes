"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import Map, { Marker, type MapRef } from "react-map-gl/maplibre";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BedDouble, Bath, Building2, Car, Compass, Layers, MapPin, Minus, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatLkr } from "@/lib/format";
import { bedroomsMatch, typeMatches } from "@/lib/natural-search";
import type { Lanka360Project } from "@/lib/lanka360";

// Same self-hosted maplibre worker + free OpenFreeMap basemap as the /projects map (map-pane.tsx).
setWorkerUrl("/maplibre-gl-worker.mjs");
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Below this zoom, projects are grouped into one bubble per city; at or above it, each project gets its own pin.
const PIN_ZOOM = 13.2;
const BUBBLE_COLORS = ["#f4a6a0", "#8fd6cf", "#9cc7f5", "#f6d36b", "#a6e3a1", "#c9b3f2"];
const TILT = 58;

const PRICE_BANDS = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under Rs. 20M", min: 1, max: 20_000_000 },
  { label: "Rs. 20M – 50M", min: 20_000_000, max: 50_000_000 },
  { label: "Rs. 50M – 100M", min: 50_000_000, max: 100_000_000 },
  { label: "Rs. 100M+", min: 100_000_000, max: Infinity },
];
const BED_OPTIONS = ["Any bedrooms", "1", "2", "3", "4+"];

function shortPrice(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${Math.round((amount / 1_000_000) * 10) / 10}M`;
  return formatLkr(amount);
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

export function Lanka360Client({ projects }: { projects: Lanka360Project[] }) {
  const mapRef = useRef<MapRef | null>(null);
  const railRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(8);
  const [tilted, setTilted] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [city, setCity] = useState("All cities");
  const [type, setType] = useState("All types");
  const [status, setStatus] = useState("Any status");
  const [beds, setBeds] = useState(BED_OPTIONS[0]);
  const [price, setPrice] = useState(PRICE_BANDS[0].label);

  const cityOptions = useMemo(() => ["All cities", ...Array.from(new Set(projects.map((p) => p.city))).sort()], [projects]);
  const typeOptions = useMemo(() => ["All types", ...Array.from(new Set(projects.map((p) => p.type).filter(Boolean))).sort()], [projects]);
  const statusOptions = useMemo(() => ["Any status", ...Array.from(new Set(projects.map((p) => p.statusLabel))).sort()], [projects]);

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.label === price) ?? PRICE_BANDS[0];
    const bedMin = beds === "Any bedrooms" ? undefined : parseInt(beds, 10);
    const bedMax = beds === "Any bedrooms" ? undefined : beds.endsWith("+") ? undefined : parseInt(beds, 10);
    return projects.filter((p) => {
      if (city !== "All cities" && p.city !== city) return false;
      if (type !== "All types" && !typeMatches(p.type, type)) return false;
      if (status !== "Any status" && p.statusLabel !== status) return false;
      if (bedMin !== undefined && !bedroomsMatch({ bedrooms: p.bedrooms }, bedMin, bedMax)) return false;
      if (band.label !== "Any price" && !(p.price >= band.min && p.price < band.max)) return false;
      return true;
    });
  }, [projects, city, type, status, beds, price]);

  const selected = useMemo(() => filtered.find((p) => p.slug === selectedSlug) ?? null, [filtered, selectedSlug]);

  // Nearby projects merge into one bubble. The grid cell shrinks as you zoom in, so bubbles split into
  // smaller groups and finally single pins. Each bubble is named after its most common city.
  const groups = useMemo(() => {
    const cell = 360 / Math.pow(2, Math.max(zoom, 3)) * 0.28;
    const cells = new globalThis.Map<string, Lanka360Project[]>();
    for (const project of filtered) {
      const key = `${Math.floor(project.lng / cell)}:${Math.floor(project.lat / cell)}`;
      cells.set(key, [...(cells.get(key) ?? []), project]);
    }
    return Array.from(cells.entries()).map(([key, items], index) => {
      const counts = new globalThis.Map<string, number>();
      items.forEach((p) => counts.set(p.city, (counts.get(p.city) ?? 0) + 1));
      const name = Array.from(counts.entries()).sort((x, y) => y[1] - x[1])[0][0];
      return {
        key,
        name,
        items,
        lat: items.reduce((sum, p) => sum + p.lat, 0) / items.length,
        lng: items.reduce((sum, p) => sum + p.lng, 0) / items.length,
        color: BUBBLE_COLORS[(index + items.length) % BUBBLE_COLORS.length],
      };
    });
  }, [filtered, zoom]);

  const fitTo = useCallback((items: { lat: number; lng: number }[], maxZoom = 15) => {
    const map = mapRef.current;
    if (!map || items.length === 0) return;
    const bounds = new LngLatBounds();
    items.forEach((item) => bounds.extend([item.lng, item.lat]));
    map.fitBounds(bounds, { padding: { top: 90, bottom: 250, left: 70, right: 70 }, maxZoom, duration: 1200, pitch: tilted ? TILT : 0 });
  }, [tilted]);

  // Re-frame the map whenever the filters change what is shown.
  useEffect(() => {
    if (filtered.length > 0) fitTo(filtered, filtered.length === 1 ? 15 : 13);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, type, status, beds, price]);

  const selectProject = useCallback((project: Lanka360Project, fly = true) => {
    setSelectedSlug(project.slug);
    if (fly) mapRef.current?.flyTo({ center: [project.lng, project.lat], zoom: 16, pitch: tilted ? TILT : 0, duration: 1400 });
  }, [tilted]);

  // Keep the chosen project's card in view in the bottom rail.
  useEffect(() => {
    if (!selectedSlug) return;
    const card = railRef.current?.querySelector<HTMLElement>(`[data-slug="${selectedSlug}"]`);
    card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedSlug]);

  const openGroup = useCallback((event: React.MouseEvent, items: Lanka360Project[]) => {
    event.stopPropagation();
    if (items.length === 1) selectProject(items[0]);
    else fitTo(items, 14);
  }, [fitTo, selectProject]);

  const reset = () => {
    setCity("All cities");
    setType("All types");
    setStatus("Any status");
    setBeds(BED_OPTIONS[0]);
    setPrice(PRICE_BANDS[0].label);
    setSelectedSlug(null);
  };
  const filtersActive = city !== "All cities" || type !== "All types" || status !== "Any status" || beds !== BED_OPTIONS[0] || price !== PRICE_BANDS[0].label;

  const toggleTilt = () => {
    const next = !tilted;
    setTilted(next);
    mapRef.current?.easeTo({ pitch: next ? TILT : 0, bearing: next ? -17 : 0, duration: 800 });
  };

  const showPins = zoom >= PIN_ZOOM;

  return (
    <main className="l360">
      <div className="l360-head">
        <h1>Lanka360</h1>
        <p>Explore every new project on a 3D map of the city around it.</p>
      </div>

      <div className="l360-app">
        <div className="l360-filters" role="group" aria-label="Filters">
          <FilterSelect icon={<MapPin size={15} aria-hidden="true" />} value={city} options={cityOptions} onChange={setCity} label="City" />
          <FilterSelect icon={<Building2 size={15} aria-hidden="true" />} value={type} options={typeOptions} onChange={setType} label="Property type" />
          <FilterSelect value={status} options={statusOptions} onChange={setStatus} label="Status" />
          <FilterSelect icon={<BedDouble size={15} aria-hidden="true" />} value={beds} options={BED_OPTIONS} onChange={setBeds} label="Bedrooms" />
          <FilterSelect value={price} options={PRICE_BANDS.map((b) => b.label)} onChange={setPrice} label="Price" />
          {filtersActive ? (
            <button type="button" className="l360-reset" onClick={reset}><RotateCcw size={14} aria-hidden="true" /> Reset</button>
          ) : null}
          <span className="l360-count">{filtered.length} of {projects.length} projects</span>
        </div>

        <div className="l360-map">
          <Map
            ref={mapRef}
            initialViewState={{ longitude: 79.9, latitude: 6.89, zoom: 10.6, pitch: TILT, bearing: -17 }}
            mapStyle={MAP_STYLE}
            maxPitch={70}
            onMove={(event) => setZoom(event.viewState.zoom)}
            onClick={() => setSelectedSlug(null)}
            style={{ width: "100%", height: "100%" }}
            attributionControl={{ compact: true }}
          >
            {!showPins
              ? groups.map((group) => {
                  const size = Math.min(88, 52 + group.items.length * 5);
                  return (
                    <Marker key={group.key} longitude={group.lng} latitude={group.lat} anchor="center">
                      <button
                        type="button"
                        className="l360-bubble"
                        style={{ width: size, height: size }}
                        aria-label={`${group.name}: ${group.items.length} project${group.items.length === 1 ? "" : "s"}`}
                        // eslint-disable-next-line react-hooks/refs -- false positive: the map ref is only read when the click happens, never while rendering
                        onClick={(event) => openGroup(event, group.items)}
                      >
                        <span className="l360-bubble-core" style={{ background: group.color }}><Building2 size={18} aria-hidden="true" /></span>
                        <span className="l360-bubble-count">{group.items.length}</span>
                        <span className="l360-bubble-name">{group.name}</span>
                      </button>
                    </Marker>
                  );
                })
              : filtered.map((project) => (
                  <Marker key={project.slug} longitude={project.lng} latitude={project.lat} anchor="bottom">
                    <button
                      type="button"
                      className={`l360-pin${selectedSlug === project.slug ? " is-selected" : ""}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectProject(project, false);
                      }}
                    >
                      <Building2 size={13} aria-hidden="true" />
                      <span>{project.price > 0 ? shortPrice(project.price) : project.name}</span>
                    </button>
                  </Marker>
                ))}
          </Map>

          {selected ? (
            <aside className="l360-card" aria-label={selected.name}>
              <div className="l360-card-media">
                <Image src={selected.heroImage} alt={selected.name} width={420} height={260} className="l360-card-img" sizes="320px" />
                <span className="l360-card-status">{selected.statusLabel}</span>
                <button type="button" className="l360-card-close" onClick={() => setSelectedSlug(null)} aria-label="Close"><X size={16} aria-hidden="true" /></button>
              </div>
              <div className="l360-card-body">
                <h2>{selected.name}</h2>
                <p className="l360-card-meta">{[selected.type, selected.developerName].filter(Boolean).join(" · ")}</p>
                <p className="l360-card-price">{selected.price > 0 ? `From ${shortPrice(selected.price)}` : selected.status}</p>
                <p className="l360-card-addr"><MapPin size={14} aria-hidden="true" /> {selected.location}</p>
                <Link href={`/projects/${selected.slug}`} className="l360-card-cta">View project <ArrowUpRight size={15} aria-hidden="true" /></Link>
              </div>
            </aside>
          ) : null}

          <div className="l360-controls">
            <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={18} /></button>
            <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={18} /></button>
            <button type="button" onClick={() => fitTo(filtered, 13)} aria-label="Show all projects"><Compass size={18} /></button>
            <button type="button" className={tilted ? "is-on" : ""} onClick={toggleTilt} aria-label="Toggle 3D view" aria-pressed={tilted}><Layers size={18} /><small>3D</small></button>
          </div>

          <div className="l360-rail" ref={railRef} role="list" aria-label="Projects">
            {filtered.length === 0 ? <p className="l360-empty">No projects match these filters. <button type="button" onClick={reset}>Reset filters</button></p> : null}
            {filtered.map((project) => (
              <article key={project.slug} role="listitem" data-slug={project.slug} className={`l360-rail-card${selectedSlug === project.slug ? " is-selected" : ""}`}>
                <button type="button" className="l360-rail-media" onClick={() => selectProject(project)} aria-label={`Show ${project.name} on the map`}>
                  <Image src={project.heroImage} alt="" width={200} height={200} className="l360-rail-img" sizes="120px" />
                  <span>{project.statusLabel}</span>
                </button>
                <div className="l360-rail-info">
                  <p className="l360-rail-type">{project.type} · {project.city}</p>
                  <h3>{project.name}</h3>
                  <p className="l360-rail-price">{project.price > 0 ? shortPrice(project.price) : project.status}</p>
                  <div className="l360-rail-chips">
                    {project.bedrooms ? <span><BedDouble size={13} aria-hidden="true" /> {project.bedrooms} bed</span> : null}
                    {project.bathrooms ? <span><Bath size={13} aria-hidden="true" /> {project.bathrooms} bath</span> : null}
                    {project.parking ? <span><Car size={13} aria-hidden="true" /> {project.parking} car</span> : null}
                  </div>
                </div>
                <Link href={`/projects/${project.slug}`} className="l360-rail-go" aria-label={`Open ${project.name}`}><ArrowUpRight size={18} aria-hidden="true" /></Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

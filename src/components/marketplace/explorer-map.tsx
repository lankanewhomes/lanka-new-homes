"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { LngLatBounds, setWorkerUrl } from "maplibre-gl";
import Map, { Marker, Popup, type MapRef } from "react-map-gl/maplibre";
import { Compass, Layers, Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { formatLkr } from "@/lib/format";

// The shared map used by /search (and /land) and by /lanka360: nearby listings merge into numbered bubbles that split as you
// zoom in, then become price pins. Clicking a bubble zooms into that area. A 3D / normal switch tilts the city. The map reports
// what part of the world is on screen so the listing list next to it can show "listings in this area" first.
// Same self-hosted maplibre worker + free OpenFreeMap basemap as the older map-pane.tsx.
setWorkerUrl("/maplibre-gl-worker.mjs");
const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const PIN_ZOOM = 13.2;
const TILT = 58;

export type ExplorerItem = { slug: string; name: string; city: string; lat: number; lng: number; price: number };
/** What the map is showing right now. `zoomed` is false while it is still the whole-country overview (zoom below 8). */
export type MapView = { west: number; south: number; east: number; north: number; zoom: number; zoomed: boolean };

// Same icons as the site header: "New Homes for Sale" (building) and "Land" (plot grid).
function MarkerIcon({ kind, size }: { kind: "homes" | "land"; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" width={size} height={size} aria-hidden="true">
      {kind === "land" ? (
        <path strokeLinecap="butt" strokeLinejoin="miter" d="M9 4.5v15m6-15v15M3 4.5h18v15H3z" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
      )}
    </svg>
  );
}

// The area with the most listings (e.g. Colombo and its suburbs). The map opens on this instead of the whole island, so the first
// thing you see is a spread of listings, not one giant bubble. "Show all" still frames everything.
function densestArea<T extends { lat: number; lng: number }>(list: T[]): T[] {
  if (list.length <= 4) return list;
  let best = list[0];
  let bestCount = 0;
  for (const a of list) {
    let count = 0;
    for (const b of list) if (Math.abs(a.lat - b.lat) < 0.2 && Math.abs(a.lng - b.lng) < 0.2) count++;
    if (count > bestCount) {
      bestCount = count;
      best = a;
    }
  }
  const near = list.filter((b) => Math.abs(best.lat - b.lat) < 0.2 && Math.abs(best.lng - b.lng) < 0.2);
  return near.length >= Math.max(4, list.length * 0.25) ? near : list;
}

function shortPrice(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${Math.round((amount / 1_000_000) * 10) / 10}M`;
  return formatLkr(amount);
}

export function ExplorerMap({
  items,
  selectedSlug,
  onSelect,
  onViewChange,
  renderPopup,
  defaultTilt = false,
  fitKey,
  kind = "homes",
}: {
  items: ExplorerItem[];
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  onViewChange?: (view: MapView) => void;
  /** Card shown next to the selected pin. */
  renderPopup?: (slug: string, close: () => void) => ReactNode;
  defaultTilt?: boolean;
  /** Changing this value re-frames the map around `items` (e.g. after the filters change). */
  fitKey?: string;
  /** Which header icon the markers use: homes (New Homes for Sale) or land (Land). */
  kind?: "homes" | "land";
}) {
  const mapRef = useRef<MapRef | null>(null);
  // Bubbles regroup once per WHOLE zoom level (not on every small scroll step), so the markers stay put while you zoom smoothly
  // instead of jumping and merging continuously.
  const [zoom, setZoom] = useState(7);
  const [tilted, setTilted] = useState(defaultTilt);

  const report = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onViewChange) return;
    const b = map.getBounds();
    const z = map.getZoom();
    onViewChange({ west: b.getWest(), south: b.getSouth(), east: b.getEast(), north: b.getNorth(), zoom: z, zoomed: z >= 8 });
  }, [onViewChange]);

  const fitTo = useCallback(
    (list: { lat: number; lng: number }[], maxZoom = 15, duration = 1100) => {
      const map = mapRef.current;
      if (!map || list.length === 0) return;
      const bounds = new LngLatBounds();
      list.forEach((item) => bounds.extend([item.lng, item.lat]));
      map.fitBounds(bounds, { padding: 70, maxZoom, duration, pitch: tilted ? TILT : 0 });
    },
    [tilted],
  );

  // Frame everything once the map is ready, and again whenever the caller says the set of listings changed.
  const firstFit = useRef(true);
  useEffect(() => {
    if (!mapRef.current || items.length === 0) return;
    const instant = firstFit.current;
    firstFit.current = false;
    fitTo(densestArea(items), items.length === 1 ? 15 : 12, instant ? 0 : 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  // Listings whose bubbles would touch on screen merge into one (measured in pixels at the current zoom level), so a zoomed-out map
  // shows a spread of separate bubbles instead of a pile. Zooming in splits them; at street level they become price pins.
  const groups = useMemo(() => {
    const radius = typeof window !== "undefined" && window.innerWidth < 760 ? 40 : 56;
    const scale = 256 * Math.pow(2, Math.max(zoom, 3));
    const toX = (lng: number) => ((lng + 180) / 360) * scale;
    const toY = (lat: number) => {
      const rad = (lat * Math.PI) / 180;
      return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * scale;
    };
    type Cluster = { items: ExplorerItem[]; x: number; y: number };
    const clusters: Cluster[] = [];
    const add = (cluster: Cluster, item: ExplorerItem) => {
      const n = cluster.items.length;
      cluster.x = (cluster.x * n + toX(item.lng)) / (n + 1);
      cluster.y = (cluster.y * n + toY(item.lat)) / (n + 1);
      cluster.items.push(item);
    };
    for (const item of items) {
      const x = toX(item.lng);
      const y = toY(item.lat);
      let nearest: Cluster | null = null;
      let best = radius;
      for (const c of clusters) {
        const d = Math.hypot(c.x - x, c.y - y);
        if (d < best) {
          best = d;
          nearest = c;
        }
      }
      if (nearest) add(nearest, item);
      else clusters.push({ items: [item], x, y });
    }
    // Averaging can pull two bubbles together — merge any pair that now touches.
    let merged = true;
    while (merged) {
      merged = false;
      outer: for (let i = 0; i < clusters.length; i++) {
        for (let j = i + 1; j < clusters.length; j++) {
          if (Math.hypot(clusters[i].x - clusters[j].x, clusters[i].y - clusters[j].y) < radius) {
            for (const item of clusters[j].items) add(clusters[i], item);
            clusters.splice(j, 1);
            merged = true;
            break outer;
          }
        }
      }
    }
    return clusters.map((cluster) => {
      const counts = new globalThis.Map<string, number>();
      cluster.items.forEach((p) => counts.set(p.city, (counts.get(p.city) ?? 0) + 1));
      const name = Array.from(counts.entries()).sort((x, y) => y[1] - x[1])[0][0];
      return {
        key: `${cluster.items[0].slug}:${cluster.items.length}`,
        name,
        group: cluster.items,
        lat: cluster.items.reduce((sum, p) => sum + p.lat, 0) / cluster.items.length,
        lng: cluster.items.reduce((sum, p) => sum + p.lng, 0) / cluster.items.length,
      };
    });
  }, [items, zoom]);

  const openGroup = useCallback(
    (event: React.MouseEvent, group: ExplorerItem[]) => {
      event.stopPropagation();
      if (group.length === 1) {
        onSelect?.(group[0].slug);
        mapRef.current?.flyTo({ center: [group[0].lng, group[0].lat], zoom: 16, pitch: tilted ? TILT : 0, duration: 1300 });
      } else {
        fitTo(group, 14);
      }
    },
    [fitTo, onSelect],
  );

  const toggleTilt = () => {
    const next = !tilted;
    setTilted(next);
    mapRef.current?.easeTo({ pitch: next ? TILT : 0, bearing: next ? -17 : 0, duration: 800 });
  };

  const showPins = zoom >= 13;
  const selected = selectedSlug ? items.find((item) => item.slug === selectedSlug) : undefined;

  return (
    <div className="xmap">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 80.7, latitude: 7.8, zoom: 6.8, pitch: defaultTilt ? TILT : 0, bearing: defaultTilt ? -17 : 0 }}
        mapStyle={MAP_STYLE}
        maxPitch={70}
        onLoad={() => {
          fitTo(densestArea(items), items.length === 1 ? 15 : 12, 0);
          report();
        }}
        onMove={(event) => {
          const level = Math.floor(event.viewState.zoom * 2) / 2;
          setZoom((current) => (current === level ? current : level));
        }}
        onMoveEnd={report}
        onClick={() => onSelect?.(null)}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        {!showPins
          ? groups.map((group) => {
              const size = Math.min(58, 40 + Math.round(Math.sqrt(group.group.length) * 3));
              return (
                <Marker key={group.key} longitude={group.lng} latitude={group.lat} anchor="center">
                  <button
                    type="button"
                    className="l360-bubble"
                    style={{ width: size, height: size }}
                    aria-label={`${group.name}: ${group.group.length} listing${group.group.length === 1 ? "" : "s"}`}
                    // eslint-disable-next-line react-hooks/refs -- false positive: the map ref is only read when the click happens
                    onClick={(event) => openGroup(event, group.group)}
                  >
                    <span className="l360-bubble-core"><MarkerIcon kind={kind} size={17} /></span>
                    <span className="l360-bubble-count">{group.group.length}</span>
                    <span className="l360-bubble-name">{group.name}</span>
                  </button>
                </Marker>
              );
            })
          : items.map((item) => (
              <Marker key={item.slug} longitude={item.lng} latitude={item.lat} anchor="bottom">
                <button
                  type="button"
                  className={`l360-pin${selectedSlug === item.slug ? " is-selected" : ""}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect?.(item.slug);
                  }}
                >
                  <MarkerIcon kind={kind} size={14} />
                  <span>{item.price > 0 ? shortPrice(item.price) : item.name}</span>
                </button>
              </Marker>
            ))}

        {selected && renderPopup ? (
          <Popup longitude={selected.lng} latitude={selected.lat} anchor="bottom" offset={34} closeButton={false} closeOnClick={false} maxWidth="260px" className="xmap-popup">
            {renderPopup(selected.slug, () => onSelect?.(null))}
          </Popup>
        ) : null}
      </Map>

      <div className="l360-controls">
        <button type="button" onClick={() => mapRef.current?.zoomIn()} aria-label="Zoom in"><Plus size={18} /></button>
        <button type="button" onClick={() => mapRef.current?.zoomOut()} aria-label="Zoom out"><Minus size={18} /></button>
        <button type="button" onClick={() => fitTo(items, 12)} aria-label="Show all listings"><Compass size={18} /></button>
        <button type="button" className={tilted ? "is-on" : ""} onClick={toggleTilt} aria-label="Toggle 3D view" aria-pressed={tilted}><Layers size={18} /><small>3D</small></button>
      </div>
    </div>
  );
}

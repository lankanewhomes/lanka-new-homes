"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, LayoutGrid, List, X } from "lucide-react";
import { RequestInfoDialog, compactLkrLabel } from "@/components/marketplace/components";
import type { LandPlot, Project, SiteMapLandmark } from "@/types";

// Plots section for land listings with more than PLOT_GRID_THRESHOLD plots (src/lib/plot-grid.ts; owner, 2026-10-06):
// every plot in this one section, nothing paged and no plot pages. Left: the block plan and a summary. Right: find a lot,
// filter by size, switch between tiles and a list, tick lots and send one enquiry. Plans give lot number and size only,
// so a price or a sold/reserved label shows only when the developer published one.

type ViewMode = "grid" | "list";

const BANDS: { label: string; min: number; max: number }[] = [
  { label: "Under 6P", min: 0, max: 6 },
  { label: "6 to 8P", min: 6, max: 8 },
  { label: "8 to 10P", min: 8, max: 10 },
  { label: "10 to 15P", min: 10, max: 15 },
  { label: "15 to 20P", min: 15, max: 20 },
  { label: "20P and above", min: 20, max: Infinity },
];

const lotLabel = (plot: LandPlot) => plot.name.replace(/^\s*lots?\s*/i, "").trim() || plot.name;
const perches = (value: number) => (Number.isInteger(value) ? value.toFixed(1) : String(value));

// TEST FEATURE (owner, 2026-10-19; shown only on lands whose plots carry a `shape`, today just /listing-preview/land-demo): an interactive site map.
// Every lot is a numbered shape coloured by live status (available, reserved, sold); a phase filter dims the rest; clicking an available or
// reserved lot ticks it for the enquiry bar below; "Book a viewing" opens the enquiry with the lot already named. Landmarks (clubhouse, pool,
// model home, park, roads) are drawn from `siteMapLandmarks`; a 360 tour of the model home opens from `tourUrl`.
const STATUS_FILL: Record<string, string> = { Available: "#bfe8c9", Reserved: "#fde7a9", Sold: "#d9d6cf" };
const STATUS_STROKE: Record<string, string> = { Available: "#2f8f4e", Reserved: "#c58a07", Sold: "#a7a39a" };
const LANDMARK_FILL: Record<SiteMapLandmark["kind"], string> = { clubhouse: "#e8dff5", pool: "#bfe3f6", "model-home": "#ffd9c2", park: "#dff1d4", road: "#e4e2db", gate: "#cfd3dc" };

function centroid(points: string): [number, number] {
  const pts = points.trim().split(/\s+/).map((pair) => pair.split(",").map(Number));
  const x = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const y = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return [x, y];
}

function LotMap({ plots, landmarks, selected, onToggle, tourUrl, onBook }: { plots: LandPlot[]; landmarks: SiteMapLandmark[]; selected: Set<string>; onToggle: (id: string) => void; tourUrl?: string; onBook: () => void }) {
  const [phase, setPhase] = useState("all");
  const [hover, setHover] = useState<string | null>(null);
  const [tour, setTour] = useState(false);
  const phases = useMemo(() => Array.from(new Set(plots.map((plot) => plot.phase).filter((p): p is string => Boolean(p)))), [plots]);
  const counts = useMemo(() => ({
    Available: plots.filter((plot) => plot.status === "Available").length,
    Reserved: plots.filter((plot) => plot.status === "Reserved").length,
    Sold: plots.filter((plot) => plot.status === "Sold").length,
  }), [plots]);
  const info = plots.find((plot) => plot.id === hover) ?? plots.find((plot) => selected.has(plot.id));

  return (
    <div className="lot-map" role="group" aria-label="Interactive lot map">
      <div className="lot-map-top">
        <div className="lot-map-phases" role="group" aria-label="Phases">
          <button type="button" className={phase === "all" ? "active" : undefined} onClick={() => setPhase("all")}>All phases</button>
          {phases.map((p) => <button key={p} type="button" className={phase === p ? "active" : undefined} onClick={() => setPhase(p)}>{p}</button>)}
        </div>
        <div className="lot-map-legend" aria-label="Legend">
          {(["Available", "Reserved", "Sold"] as const).map((status) => <span key={status}><i style={{ background: STATUS_FILL[status], borderColor: STATUS_STROKE[status] }} />{status} <b>{counts[status]}</b></span>)}
        </div>
      </div>
      <div className="lot-map-stage">
        <svg viewBox="0 0 1000 700" role="img" aria-label="Site map with numbered lots">
          <rect x="0" y="0" width="1000" height="700" fill="#f4f1ea" />
          {landmarks.map((l, i) => {
            const [cx, cy] = centroid(l.shape);
            return (
              <g key={`${l.kind}-${i}`}>
                <polygon points={l.shape} fill={LANDMARK_FILL[l.kind]} stroke="#b9b5aa" strokeWidth={l.kind === "road" ? 0 : 1.5} />
                {l.label && l.kind !== "road" ? <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="700" fill="#3b3a36">{l.label}</text> : null}
                {l.kind === "road" && l.label ? <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill="#8c887d">{l.label}</text> : null}
              </g>
            );
          })}
          {plots.filter((plot) => plot.shape).map((plot) => {
            const status = plot.status ?? "Available";
            const dim = phase !== "all" && plot.phase !== phase;
            const isSelected = selected.has(plot.id);
            const clickable = status !== "Sold";
            const [cx, cy] = centroid(plot.shape as string);
            const number = plot.name.replace(/^\s*lots?\s*/i, "").trim();
            return (
              <g
                key={plot.id}
                className={`lot-map-lot${isSelected ? " is-selected" : ""}${clickable ? " is-clickable" : ""}`}
                opacity={dim ? 0.25 : 1}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                aria-pressed={clickable ? isSelected : undefined}
                aria-label={`Lot ${number}, ${plot.sizePerches} perches, ${status}`}
                onMouseEnter={() => setHover(plot.id)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(plot.id)}
                onBlur={() => setHover(null)}
                onClick={() => { if (clickable) onToggle(plot.id); }}
                onKeyDown={(event) => { if (clickable && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onToggle(plot.id); } }}
              >
                <polygon points={plot.shape} fill={STATUS_FILL[status]} stroke={isSelected ? "#1c1c20" : STATUS_STROKE[status]} strokeWidth={isSelected ? 4 : 1.5} />
                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="17" fontWeight="700" fill={status === "Sold" ? "#8c887d" : "#1c1c20"} pointerEvents="none">{number}</text>
              </g>
            );
          })}
        </svg>
        <div className="lot-map-info" aria-live="polite">
          {info ? (
            <>
              <p className="lot-map-info-lot">Lot {info.name.replace(/^\s*lots?\s*/i, "")} <span className={`lot-map-badge is-${(info.status ?? "Available").toLowerCase()}`}>{info.status ?? "Available"}</span></p>
              <dl>
                <div><dt>Size</dt><dd>{info.sizePerches > 0 ? `${info.sizePerches} perches` : "Not stated"}</dd></div>
                {info.phase ? <div><dt>Phase</dt><dd>{info.phase}</dd></div> : null}
                {(info.priceLkr ?? 0) > 0 ? <div><dt>Price</dt><dd>{compactLkrLabel(info.priceLkr ?? 0)}</dd></div> : null}
              </dl>
              {info.status !== "Sold" ? <button type="button" className="lot-map-book" onClick={() => { if (!selected.has(info.id)) onToggle(info.id); onBook(); }}>Book a viewing of this lot</button> : <p className="lot-map-sold">This lot has been sold.</p>}
            </>
          ) : <p className="lot-map-hint">Tap a lot on the map to see its size and price, then book a viewing in one click.</p>}
        </div>
      </div>
      {tourUrl ? (
        <div className="lot-map-tour">
          <button type="button" onClick={() => setTour(!tour)} aria-expanded={tour}>{tour ? "Close the model home tour" : "Walk through the model home in 360°"}</button>
          {tour ? <iframe src={tourUrl} title="Model home 360 tour" loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /> : null}
        </div>
      ) : null}
    </div>
  );
}

export function LandPlotsGridSection({ plots, project, blockPlan, landmarks, tourUrl }: { plots: LandPlot[]; project: Project; blockPlan?: string; landmarks?: SiteMapLandmark[]; tourUrl?: string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [requestOpen, setRequestOpen] = useState(false);
  const [viewing, setViewing] = useState(false);
  const hasMap = plots.some((plot) => Boolean(plot.shape));

  const sizes = useMemo(() => plots.map((plot) => plot.sizePerches).filter((n) => n > 0), [plots]);
  const minSize = sizes.length ? Math.min(...sizes) : 0;
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const commonSize = useMemo(() => {
    const counts = new Map<number, number>();
    for (const n of sizes) counts.set(n, (counts.get(n) ?? 0) + 1);
    let best = 0, bestCount = 0;
    for (const [size, count] of counts) if (count > bestCount) { best = size; bestCount = count; }
    return { size: best, count: bestCount };
  }, [sizes]);
  const bands = useMemo(() => BANDS.map((b) => ({ ...b, count: plots.filter((plot) => plot.sizePerches >= b.min && plot.sizePerches < b.max).length })).filter((b) => b.count > 0), [plots]);
  const hasPrices = plots.some((plot) => (plot.priceLkr ?? 0) > 0);
  const hasStatus = plots.some((plot) => plot.status);

  const lo = from.trim() === "" ? null : Number(from);
  const hi = to.trim() === "" ? null : Number(to);
  const visible = useMemo(() => {
    const list = plots.filter((plot) => {
      if (lo !== null && Number.isFinite(lo) && plot.sizePerches < lo) return false;
      if (hi !== null && Number.isFinite(hi) && plot.sizePerches > hi) return false;
      return true;
    });
    list.sort((a, b) => lotLabel(a).localeCompare(lotLabel(b), undefined, { numeric: true }));
    return list;
  }, [plots, lo, hi]);

  const filtered = from !== "" || to !== "";
  const clearFilters = () => { setFrom(""); setTo(""); };
  const setBand = (band: { min: number; max: number }) => { setFrom(band.min > 0 ? String(band.min) : ""); setTo(Number.isFinite(band.max) ? String(Math.round((band.max - 0.1) * 10) / 10) : ""); };
  const activeBand = (band: { min: number; max: number }) => from === (band.min > 0 ? String(band.min) : "") && to === (Number.isFinite(band.max) ? String(Math.round((band.max - 0.1) * 10) / 10) : "");

  const selectedPlots = plots.filter((plot) => selected.has(plot.id));
  const selectedTotal = selectedPlots.reduce((sum, plot) => sum + plot.sizePerches, 0);
  const selectionMessage = selectedPlots.length
    ? viewing
      ? `I'd like to book a viewing of ${selectedPlots.length === 1 ? "lot" : "lots"} ${selectedPlots.map(lotLabel).join(", ")} at ${project.name}. Preferred day and time: `
      : `I'm interested in ${selectedPlots.length === 1 ? "lot" : "lots"} ${selectedPlots.map(lotLabel).join(", ")} at ${project.name}.`
    : "";

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sizeText = (plot: LandPlot) => (plot.sizePerches > 0 ? `${perches(plot.sizePerches)}P` : "Not stated");

  return (
    <section id="plans-homes" className="plots-grid-shell" aria-label="Plots">
      <div className="plots-grid-head">
        <h2>Plots</h2>
        <p>Choose the lots you like, tick them, and send one enquiry.</p>
      </div>

      {hasMap ? <LotMap plots={plots} landmarks={landmarks ?? []} selected={selected} onToggle={toggle} tourUrl={tourUrl} onBook={() => { setViewing(true); setRequestOpen(true); }} /> : null}

      <div className="plots-grid-controls">
        <div className="plots-grid-controls-row">
          <div className="plots-grid-chips" role="group" aria-label="Quick size filters">
            <button type="button" className={!filtered ? "active" : undefined} aria-pressed={!filtered} onClick={clearFilters}>All ({plots.length})</button>
            {bands.map((band) => (
              <button key={band.label} type="button" className={activeBand(band) ? "active" : undefined} aria-pressed={activeBand(band)} onClick={() => setBand(band)}>
                {band.label} ({band.count})
              </button>
            ))}
          </div>
          <div className="plots-grid-view" role="group" aria-label="View">
            <button type="button" className={view === "grid" ? "active" : undefined} aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" aria-hidden="true" /> Tiles</button>
            <button type="button" className={view === "list" ? "active" : undefined} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="h-4 w-4" aria-hidden="true" /> List</button>
          </div>
        </div>

        <p className="plots-grid-count" aria-live="polite">
          Showing {visible.length} of {plots.length} plots{filtered ? <> · <button type="button" onClick={clearFilters}>Clear filters</button></> : null}
        </p>
      </div>

      <div className={`plots-grid-layout${blockPlan ? " has-plan" : ""}`}>
        <aside className="plots-grid-side">
          {blockPlan ? (
            <a className="plots-grid-plan" href={blockPlan} target="_blank" rel="noopener noreferrer" aria-label="Open the block plan in a new tab">
              <Image src={blockPlan} alt={`${project.name} block plan`} width={1600} height={900} sizes="(max-width: 1000px) 100vw, 520px" />
              <span>Block plan. Tap to enlarge.</span>
            </a>
          ) : null}
          <dl className="plots-grid-facts">
            <div><dt>Total plots</dt><dd>{plots.length}</dd></div>
            {sizes.length ? <div><dt>Smallest</dt><dd>{perches(minSize)}P</dd></div> : null}
            {sizes.length ? <div><dt>Largest</dt><dd>{perches(maxSize)}P</dd></div> : null}
            {commonSize.count > 1 ? <div><dt>Most common</dt><dd>{perches(commonSize.size)}P <small>({commonSize.count} lots)</small></dd></div> : null}
          </dl>
        </aside>

        <div className="plots-grid-main">
          {visible.length === 0 ? (
            <p className="plots-grid-empty">No lots match these filters.</p>
          ) : view === "grid" ? (
            <div className={`plots-grid-tiles${visible.length > 60 ? " is-scroll" : ""}`} role="group" aria-label="Plots" tabIndex={visible.length > 60 ? 0 : undefined}>
              {visible.map((plot) => {
                const isSelected = selected.has(plot.id);
                return (
                  <button
                    key={plot.id}
                    type="button"
                    className={`plots-grid-tile${isSelected ? " is-selected" : ""}${plot.status === "Sold" ? " is-sold" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => toggle(plot.id)}
                    title={`Lot ${lotLabel(plot)}, ${plot.sizePerches > 0 ? `${perches(plot.sizePerches)} perches` : "size not stated"}`}
                  >
                    <span className="plots-grid-tile-lot">Lot {lotLabel(plot)}</span>
                    <span className="plots-grid-tile-size">{plot.sizePerches > 0 ? <>{perches(plot.sizePerches)}<small>P</small></> : "-"}</span>
                    {(plot.priceLkr ?? 0) > 0 ? <span className="plots-grid-tile-price">{compactLkrLabel(plot.priceLkr ?? 0)}</span> : null}
                    {plot.status && plot.status !== "Available" ? <span className="plots-grid-tile-status">{plot.status}</span> : null}
                    <span className="plots-grid-tile-check" aria-hidden="true"><Check className="h-3.5 w-3.5" /></span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={`plots-grid-table-wrap${visible.length > 60 ? " is-scroll" : ""}`} tabIndex={visible.length > 60 ? 0 : undefined}>
              <table className="plots-grid-table">
                <thead>
                  <tr><th scope="col"><span className="sr-only">Select</span></th><th scope="col">Lot</th><th scope="col">Size</th>{hasPrices ? <th scope="col">Price</th> : null}{hasStatus ? <th scope="col">Status</th> : null}</tr>
                </thead>
                <tbody>
                  {visible.map((plot) => {
                    const isSelected = selected.has(plot.id);
                    return (
                      <tr key={plot.id} className={isSelected ? "is-selected" : undefined} onClick={() => toggle(plot.id)}>
                        <td><input type="checkbox" checked={isSelected} onChange={() => toggle(plot.id)} onClick={(event) => event.stopPropagation()} aria-label={`Select lot ${lotLabel(plot)}`} /></td>
                        <td>Lot {lotLabel(plot)}</td>
                        <td>{sizeText(plot)}</td>
                        {hasPrices ? <td>{(plot.priceLkr ?? 0) > 0 ? compactLkrLabel(plot.priceLkr ?? 0) : "-"}</td> : null}
                        {hasStatus ? <td>{plot.status ?? "-"}</td> : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedPlots.length > 0 ? (
        <div className="plots-grid-selection" role="status">
          <p>
            {selectedPlots.length} {selectedPlots.length === 1 ? "lot" : "lots"} selected: {selectedPlots.map(lotLabel).join(", ")}
            {selectedTotal > 0 ? ` (${perches(Math.round(selectedTotal * 10) / 10)} perches in total)` : ""}
          </p>
          <div>
            <button type="button" className="plots-grid-clear" onClick={() => setSelected(new Set())}><X className="h-4 w-4" aria-hidden="true" /> Clear</button>
            <button type="button" className="plots-grid-enquire" onClick={() => { setViewing(false); setRequestOpen(true); }}>Enquire about these lots</button>
          </div>
        </div>
      ) : null}

      <RequestInfoDialog key={selectionMessage} open={requestOpen} onClose={() => setRequestOpen(false)} project={project} variant="inquiry" defaultMessage={selectionMessage} />
    </section>
  );
}

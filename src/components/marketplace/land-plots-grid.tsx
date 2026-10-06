"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, LayoutGrid, List, Search, X } from "lucide-react";
import { RequestInfoDialog, compactLkrLabel } from "@/components/marketplace/components";
import type { LandPlot, Project } from "@/types";

// Plots section for land listings with more than PLOT_GRID_THRESHOLD plots (src/lib/plot-grid.ts; owner, 2026-10-06):
// every plot in this one section, nothing paged and no plot pages. Left: the block plan and a summary. Right: find a lot,
// filter by size, switch between tiles and a list, tick lots and send one enquiry. Plans give lot number and size only,
// so a price or a sold/reserved label shows only when the developer published one.

type SortKey = "lot" | "sizeAsc" | "sizeDesc";
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

export function LandPlotsGridSection({ plots, project, blockPlan }: { plots: LandPlot[]; project: Project; blockPlan?: string }) {
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("lot");
  const [view, setView] = useState<ViewMode>("grid");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [requestOpen, setRequestOpen] = useState(false);

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
    const q = query.trim().toLowerCase();
    const list = plots.filter((plot) => {
      if (q && !lotLabel(plot).toLowerCase().includes(q)) return false;
      if (lo !== null && Number.isFinite(lo) && plot.sizePerches < lo) return false;
      if (hi !== null && Number.isFinite(hi) && plot.sizePerches > hi) return false;
      return true;
    });
    const byLot = (a: LandPlot, b: LandPlot) => lotLabel(a).localeCompare(lotLabel(b), undefined, { numeric: true });
    if (sortBy === "sizeAsc") list.sort((a, b) => a.sizePerches - b.sizePerches || byLot(a, b));
    else if (sortBy === "sizeDesc") list.sort((a, b) => b.sizePerches - a.sizePerches || byLot(a, b));
    else list.sort(byLot);
    return list;
  }, [plots, query, lo, hi, sortBy]);

  const filtered = query.trim() !== "" || from !== "" || to !== "";
  const clearFilters = () => { setQuery(""); setFrom(""); setTo(""); };
  const setBand = (band: { min: number; max: number }) => { setFrom(band.min > 0 ? String(band.min) : ""); setTo(Number.isFinite(band.max) ? String(Math.round((band.max - 0.1) * 10) / 10) : ""); };
  const activeBand = (band: { min: number; max: number }) => from === (band.min > 0 ? String(band.min) : "") && to === (Number.isFinite(band.max) ? String(Math.round((band.max - 0.1) * 10) / 10) : "");

  const selectedPlots = plots.filter((plot) => selected.has(plot.id));
  const selectedTotal = selectedPlots.reduce((sum, plot) => sum + plot.sizePerches, 0);
  const selectionMessage = selectedPlots.length
    ? `I'm interested in ${selectedPlots.length === 1 ? "lot" : "lots"} ${selectedPlots.map(lotLabel).join(", ")} at ${project.name}.`
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
          <div className="plots-grid-toolbar">
            <label className="plots-grid-search">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input type="search" inputMode="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a lot number" aria-label="Find a lot number" />
            </label>
            <div className="plots-grid-range" role="group" aria-label="Size in perches">
              <span>Size</span>
              <input type="number" inputMode="decimal" min={0} step="0.1" value={from} onChange={(event) => setFrom(event.target.value)} placeholder={perches(minSize)} aria-label="From perches" />
              <span aria-hidden="true">to</span>
              <input type="number" inputMode="decimal" min={0} step="0.1" value={to} onChange={(event) => setTo(event.target.value)} placeholder={perches(maxSize)} aria-label="To perches" />
              <span>P</span>
            </div>
            <label className="plots-grid-sort">
              <span>Sort</span>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)}>
                <option value="lot">Lot number</option>
                <option value="sizeAsc">Size, small to large</option>
                <option value="sizeDesc">Size, large to small</option>
              </select>
            </label>
            <div className="plots-grid-view" role="group" aria-label="View">
              <button type="button" className={view === "grid" ? "active" : undefined} aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid className="h-4 w-4" aria-hidden="true" /> Tiles</button>
              <button type="button" className={view === "list" ? "active" : undefined} aria-pressed={view === "list"} onClick={() => setView("list")}><List className="h-4 w-4" aria-hidden="true" /> List</button>
            </div>
          </div>

          <div className="plots-grid-chips" role="group" aria-label="Quick size filters">
            <button type="button" className={!filtered ? "active" : undefined} aria-pressed={!filtered} onClick={clearFilters}>All ({plots.length})</button>
            {bands.map((band) => (
              <button key={band.label} type="button" className={activeBand(band) ? "active" : undefined} aria-pressed={activeBand(band)} onClick={() => setBand(band)}>
                {band.label} ({band.count})
              </button>
            ))}
          </div>

          <p className="plots-grid-count" aria-live="polite">
            Showing {visible.length} of {plots.length} plots{filtered ? <> · <button type="button" onClick={clearFilters}>Clear filters</button></> : null}
          </p>

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
            <button type="button" className="plots-grid-enquire" onClick={() => setRequestOpen(true)}>Enquire about these lots</button>
          </div>
        </div>
      ) : null}

      <RequestInfoDialog key={selectionMessage} open={requestOpen} onClose={() => setRequestOpen(false)} project={project} variant="inquiry" defaultMessage={selectionMessage} />
    </section>
  );
}

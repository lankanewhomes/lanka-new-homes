"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Columns3, Copy, Filter, Inbox, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useCollection, useDash } from "./DashProvider";
import { StatusChip } from "./StatusChip";
import { PageHero, heroBtnSolid } from "./PageHero";
import { flatFields, getPath } from "./schema-utils";
import type { CollectionSchema, Row, SchemaField } from "../_mock/types";

// Generic list page for any Payload collection, driven by the exported schema: search, filters (on dropdown fields),
// sortable columns, a column picker, pagination, bulk select + bulk actions, row actions and loading / empty states.

const PAGE_SIZES = [10, 25, 50];
const fmtDate = (v: unknown) => { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

function Cell({ field, row, titleOf }: { field: SchemaField; row: Row; titleOf: (collection: string, id: unknown) => string }) {
  const v = getPath(row, field.name ?? "");
  if (v === null || v === undefined || v === "") return <span className="text-muted/50">—</span>;
  switch (field.type) {
    case "checkbox": return v ? <Check size={15} className="text-ok" /> : <span className="text-muted/50">—</span>;
    case "select": case "radio": {
      const list = (Array.isArray(v) ? v : [v]) as (string | number)[];
      return <span className="flex flex-wrap gap-1">{list.slice(0, 2).map((x) => <StatusChip key={String(x)} value={String(x)} label={field.options?.find((o) => o.value === x)?.label} />)}{list.length > 2 ? <span className="text-xs text-muted">+{list.length - 2}</span> : null}</span>;
    }
    case "date": return <span className="whitespace-nowrap text-muted">{fmtDate(v)}</span>;
    case "number": return <span className="tabular-nums">{/price|lkr|amount|cost/i.test(field.name ?? "") ? `Rs. ${Number(v).toLocaleString("en-LK")}` : Number(v).toLocaleString("en-LK")}</span>;
    case "relationship": case "upload": {
      const list = (Array.isArray(v) ? v : [v]) as unknown[];
      const names = list.slice(0, 2).map((x) => (typeof x === "object" && x ? titleOf((x as { relationTo: string }).relationTo, (x as { value: unknown }).value) : titleOf(field.relationTo?.[0] ?? "", x)));
      return <span className="truncate">{names.join(", ")}{list.length > 2 ? ` +${list.length - 2}` : ""}</span>;
    }
    case "array": return <span className="text-muted">{(v as unknown[]).length} item{(v as unknown[]).length === 1 ? "" : "s"}</span>;
    case "group": return <span className="text-muted">…</span>;
    default: return <span className="line-clamp-1 max-w-[22rem]">{String(v)}</span>;
  }
}

type ListProps = { slug: string; initialFilter?: { field: string; value: string } | null };

/** Keyed by collection so search, filters, sort and selection start fresh when you open another one. */
export function CollectionList(props: ListProps) {
  return <ListInner key={props.slug} {...props} />;
}

function ListInner({ slug, initialFilter }: ListProps) {
  const d = useDash();
  const router = useRouter();
  const { schema, rows, ready } = useCollection(slug);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<{ field: string; value: string }[]>(initialFilter ? [initialFilter] : []);
  const [sort, setSort] = useState<{ field: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [picked, setPicked] = useState<Set<number | string>>(new Set());
  const [cols, setCols] = useState<string[] | null>(null);
  const [panel, setPanel] = useState<"" | "filter" | "cols">("");
  const [confirm, setConfirm] = useState<(number | string)[] | null>(null);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, []);
  const resetView = () => { setPage(1); setPicked(new Set()); };
  const onSearch = (v: string) => { setQ(v); resetView(); };
  const applyFilters = (next: { field: string; value: string }[]) => { setFilters(next); resetView(); };

  const fields = useMemo(() => (schema ? flatFields(schema.fields).filter((f) => !f.hidden) : []), [schema]);
  const byName = useMemo(() => new Map(fields.map((f) => [f.name, f])), [fields]);
  const defaultCols = useMemo(() => {
    if (!schema) return [];
    const wanted = schema.defaultColumns.filter((c) => byName.has(c));
    const base = wanted.length ? wanted : fields.filter((f) => ["text", "select", "number", "date", "checkbox", "email", "relationship"].includes(f.type)).slice(0, 5).map((f) => f.name!);
    return base.includes("createdAt") || !byName.has("createdAt") ? base : base;
  }, [schema, byName, fields]);
  const shown = (cols ?? defaultCols).map((n) => byName.get(n)).filter(Boolean) as SchemaField[];
  const titleField = schema?.useAsTitle && byName.has(schema.useAsTitle) ? schema.useAsTitle : shown[0]?.name;

  // Make sure the collections that shown relationship columns point at are loaded, so their names can be shown.
  const relTargets = useMemo(() => Array.from(new Set(shown.flatMap((f) => (f.type === "relationship" ? f.relationTo ?? [] : [])))), [shown]);
  useEffect(() => { relTargets.forEach((t) => d.ensure(t)); }, [d, relTargets]);
  useEffect(() => { if (slug === "leads" || slug === "analytics") d.ensure("projects"); }, [d, slug]);
  const titleOf = (coll: string, id: unknown) => {
    const s = d.schemaOf(coll) as CollectionSchema | undefined;
    const r = d.rowsOf(coll)?.find((x) => x.id === id);
    const t = s?.useAsTitle && r ? r[s.useAsTitle] : undefined;
    return String(t || `${s?.singular ?? coll} #${String(id)}`);
  };

  const processed = useMemo(() => {
    let list = rows ?? [];
    const s = q.trim().toLowerCase();
    if (s) {
      const searchable = schema?.searchable.length ? schema.searchable : fields.filter((f) => f.type === "text" || f.type === "email" || f.type === "textarea").map((f) => f.name!);
      list = list.filter((r) => searchable.some((n) => String(getPath(r, n) ?? "").toLowerCase().includes(s)) || String(r.id) === s);
    }
    for (const f of filters) list = list.filter((r) => { const v = getPath(r, f.field); return Array.isArray(v) ? v.map(String).includes(f.value) : String(v) === f.value; });
    if (sort) {
      const { field, dir } = sort;
      list = [...list].sort((a, b) => { const x = getPath(a, field), y = getPath(b, field); if (x === y) return 0; if (x == null) return 1; if (y == null) return -1; return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true })) * dir; });
    }
    return list;
  }, [rows, q, filters, sort, schema, fields]);

  if (!schema) return <ListSkeleton />;
  const pages = Math.max(1, Math.ceil(processed.length / size));
  const slice = processed.slice((page - 1) * size, page * size);
  const allOnPage = slice.length > 0 && slice.every((r) => picked.has(r.id));
  const filterable = fields.filter((f) => (f.type === "select" || f.type === "radio" || f.type === "checkbox") && (f.options?.length ?? 2) <= 40);
  const dev = d.role === "developer" && ["projects", "lands", "leads", "developers", "subscriptions", "payments", "team-members", "analytics", "reviews", "addon-requests", "hero-slides"].includes(slug);

  const bulkDelete = (ids: (number | string)[]) => { d.deleteRows(slug, ids); setPicked(new Set()); setConfirm(null); d.toast(`${ids.length} ${ids.length === 1 ? schema.singular : schema.label} deleted`); };

  return (
    <div>
      <PageHero
        title={`${schema.label}.`}
        description={schema.description ?? (ready ? `${processed.length} of ${(rows ?? []).length} ${schema.label.toLowerCase()} match what you are looking at.` : "")}
        stat={{ label: `Total ${schema.label.toLowerCase()}`, value: ready ? String((rows ?? []).length) : "…" }}
        actions={<Link href={`/dashboard/${slug}/new`} className={heroBtnSolid}><Plus size={15} /> New {schema.singular.toLowerCase()}</Link>}
      />
      {dev ? <p className="mb-4 rounded-md border border-line bg-accent-soft px-3 py-2 text-sm text-accent">You are previewing the Developer view: only {`Prime Lands`}&apos; own records are listed here, as Payload&apos;s access rules require.</p> : null}

      <div className="d-box">
      <div className="rounded-xl border border-line bg-panel shadow-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          <div className="relative min-w-52 flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${schema.label.toLowerCase()}…`} className="w-full rounded-md border border-line bg-bg py-1.5 pl-9 pr-3 text-sm outline-none focus:border-accent" />
          </div>
          <div className="relative">
            <button type="button" onClick={() => setPanel(panel === "filter" ? "" : "filter")} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-subtle"><Filter size={14} /> Filters{filters.length ? <span className="rounded-full bg-accent px-1.5 text-[10px] text-white">{filters.length}</span> : null}</button>
            {panel === "filter" ? <FilterPanel fields={filterable} onAdd={(f) => { applyFilters([...filters.filter((y) => y.field !== f.field), f]); setPanel(""); }} onClose={() => setPanel("")} /> : null}
          </div>
          <div className="relative">
            <button type="button" onClick={() => setPanel(panel === "cols" ? "" : "cols")} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-subtle"><Columns3 size={14} /> Columns</button>
            {panel === "cols" ? (
              <div className="d-scroll absolute right-0 z-20 mt-1 max-h-72 w-60 overflow-y-auto rounded-lg border border-line bg-panel p-1 shadow-card">
                {fields.filter((f) => !["array", "group", "richText", "textarea"].includes(f.type)).map((f) => {
                  const on = (cols ?? defaultCols).includes(f.name!);
                  return <button key={f.name} type="button" onClick={() => setCols(on ? (cols ?? defaultCols).filter((c) => c !== f.name) : [...(cols ?? defaultCols), f.name!])} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-subtle"><Check size={14} className={on ? "text-accent" : "opacity-0"} />{f.label ?? f.name}</button>;
                })}
              </div>
            ) : null}
          </div>
        </div>
        {filters.length ? (
          <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
            {filters.map((f) => <span key={f.field} className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs">{byName.get(f.field)?.label ?? f.field}: <b>{byName.get(f.field)?.options?.find((o) => String(o.value) === f.value)?.label ?? f.value}</b><button type="button" aria-label="Remove filter" onClick={() => applyFilters(filters.filter((x) => x !== f))}><X size={12} /></button></span>)}
            <button type="button" onClick={() => applyFilters([])} className="text-xs text-muted hover:text-fg">Clear all</button>
          </div>
        ) : null}
        {picked.size ? (
          <div className="flex items-center gap-3 border-b border-line bg-accent-soft px-3 py-2 text-sm">
            <span className="font-medium">{picked.size} selected</span>
            {byName.has("isPublished") ? <button type="button" onClick={() => { picked.forEach((id) => { const r = (rows ?? []).find((x) => x.id === id); if (r) d.saveRow(slug, { ...r, isPublished: true }); }); d.toast(`${picked.size} published`); setPicked(new Set()); }} className="rounded border border-line bg-panel px-2.5 py-1 text-xs font-medium hover:border-accent">Publish</button> : null}
            <button type="button" onClick={() => setConfirm([...picked])} className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-xs font-medium text-bad hover:border-bad"><Trash2 size={12} /> Delete</button>
            <button type="button" onClick={() => setPicked(new Set())} className="ml-auto text-xs text-muted hover:text-fg">Clear</button>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="w-10 px-3 py-2.5"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={(e) => setPicked(e.target.checked ? new Set([...picked, ...slice.map((r) => r.id)]) : new Set([...picked].filter((id) => !slice.some((r) => r.id === id))))} /></th>
                {shown.map((f) => (
                  <th key={f.name} className="whitespace-nowrap px-3 py-2.5">
                    <button type="button" onClick={() => setSort(sort && sort.field === f.name ? (sort.dir === 1 ? { field: f.name!, dir: -1 } : null) : { field: f.name!, dir: 1 })} className="inline-flex items-center gap-1 uppercase hover:text-fg">
                      {f.label ?? f.name}{sort && sort.field === f.name ? (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : null}
                    </button>
                  </th>
                ))}
                <th className="w-28 px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {loading || !ready ? Array.from({ length: 6 }, (_, i) => <tr key={i} className="border-b border-line last:border-0"><td className="px-3 py-3"><div className="d-skeleton h-4 w-4" /></td>{shown.map((f) => <td key={f.name} className="px-3 py-3"><div className="d-skeleton h-4 w-full max-w-40" /></td>)}<td /></tr>) : slice.map((r) => (
                <tr key={String(r.id)} onClick={() => router.push(`/dashboard/${slug}/${r.id}`)} className="group cursor-pointer border-b border-line last:border-0 hover:bg-subtle/60">
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select row ${r.id}`} checked={picked.has(r.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
                  {shown.map((f) => <td key={f.name} className={`px-3 py-2.5 ${f.name === titleField ? "min-w-[16rem] font-medium" : ""}`}><Cell field={f} row={r} titleOf={titleOf} /></td>)}
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <span className="flex justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                      <Link href={`/dashboard/${slug}/${r.id}`} aria-label="Edit" className="rounded p-1.5 text-muted hover:bg-panel hover:text-fg"><Pencil size={14} /></Link>
                      <button type="button" aria-label="Duplicate" onClick={() => { d.duplicateRow(slug, r.id); d.toast("Duplicated"); }} className="rounded p-1.5 text-muted hover:bg-panel hover:text-fg"><Copy size={14} /></button>
                      <button type="button" aria-label="Delete" onClick={() => setConfirm([r.id])} className="rounded p-1.5 text-muted hover:bg-panel hover:text-bad"><Trash2 size={14} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && ready && processed.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-subtle text-muted"><Inbox size={22} /></span>
              <p className="font-medium">{(rows ?? []).length === 0 ? `No ${schema.label.toLowerCase()} yet` : "Nothing matches"}</p>
              <p className="max-w-sm text-sm text-muted">{(rows ?? []).length === 0 ? `Create the first ${schema.singular.toLowerCase()} to see it here.` : "Try a different search or clear the filters."}</p>
              {(rows ?? []).length === 0 ? <Link href={`/dashboard/${slug}/new`} className="mt-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">New {schema.singular.toLowerCase()}</Link> : <button type="button" onClick={() => { onSearch(""); applyFilters([]); }} className="mt-1 rounded-md border border-line px-3 py-1.5 text-sm">Clear search and filters</button>}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm text-muted">
          <span>{processed.length === 0 ? "0 results" : `${(page - 1) * size + 1}–${Math.min(page * size, processed.length)} of ${processed.length}`}</span>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5">Per page<select value={size} onChange={(e) => { setSize(Number(e.target.value)); resetView(); }} className="rounded border border-line bg-panel px-1.5 py-1 text-fg">{PAGE_SIZES.map((n) => <option key={n}>{n}</option>)}</select></label>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded border border-line p-1 text-fg disabled:opacity-40"><ChevronLeft size={15} /></button>
              <span className="px-1">Page {page} / {pages}</span>
              <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded border border-line p-1 text-fg disabled:opacity-40"><ChevronRight size={15} /></button>
            </div>
          </div>
        </div>
      </div>
      </div>

      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Delete {confirm.length} {confirm.length === 1 ? schema.singular.toLowerCase() : schema.label.toLowerCase()}?</h2>
            <p className="mt-1.5 text-sm text-muted">This is a preview: nothing is deleted from your real data, and a page reload brings the mock records back.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-md border border-line px-3 py-1.5 text-sm">Cancel</button>
              <button type="button" onClick={() => bulkDelete(confirm)} className="rounded-md bg-bad px-3 py-1.5 text-sm font-medium text-white">Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterPanel({ fields, onAdd, onClose }: { fields: SchemaField[]; onAdd: (f: { field: string; value: string }) => void; onClose: () => void }) {
  const [field, setField] = useState(fields[0]?.name ?? "");
  const f = fields.find((x) => x.name === field);
  const options = f?.type === "checkbox" ? [{ label: "Yes", value: "true" }, { label: "No", value: "false" }] : (f?.options ?? []).map((o) => ({ label: o.label, value: String(o.value) }));
  if (!fields.length) return <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-line bg-panel p-3 text-sm text-muted shadow-card">No filterable fields in this collection.</div>;
  return (
    <div className="absolute right-0 z-20 mt-1 w-72 space-y-2 rounded-lg border border-line bg-panel p-3 shadow-card">
      <select value={field} onChange={(e) => setField(e.target.value)} className="w-full rounded border border-line bg-panel px-2 py-1.5 text-sm">{fields.map((x) => <option key={x.name} value={x.name}>{x.label ?? x.name}</option>)}</select>
      <div className="d-scroll max-h-48 space-y-0.5 overflow-y-auto">{options.map((o) => <button key={o.value} type="button" onClick={() => onAdd({ field, value: o.value })} className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-subtle">{o.label}</button>)}</div>
      <button type="button" onClick={onClose} className="text-xs text-muted hover:text-fg">Close</button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <div className="d-skeleton mb-5 h-7 w-48" />
      <div className="rounded-xl border border-line bg-panel p-3">{Array.from({ length: 7 }, (_, i) => <div key={i} className="d-skeleton my-2 h-5 w-full" />)}</div>
    </div>
  );
}

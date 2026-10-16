"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Columns3, BadgeCheck, Copy, Filter, Inbox, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useDash, useSchema } from "./DashProvider";
import { PageHero, heroBtnSolid } from "./PageHero";
import { StatusChip } from "./StatusChip";
import { flatFields, getPath } from "./schema-utils";
import { allOf } from "../_data/scope";
import { apiCount, apiCreate, apiDelete, apiFind, apiGet, apiUpdate, type Doc, type Where } from "../_data/api";
import { TABS, loadTiles, type Tile } from "../_data/list-extras";
import type { SchemaField } from "../_mock/types";

// Generic list page for any Payload collection, driven by the exported schema and loaded from Payload's REST API one page at a
// time: server-side search, filters (on dropdown fields), sort and pagination, a column picker, bulk select + bulk actions, row
// actions and loading / error / empty states.

const PAGE_SIZES = [10, 30, 50];
const fmtDate = (v: unknown) => { const d = new Date(String(v)); return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); };

function Cell({ field, row, titleOf }: { field: SchemaField; row: Doc; titleOf: (collection: string, id: unknown) => string }) {
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
  const schema = useSchema(slug);
  const [rows, setRows] = useState<Doc[] | null>(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  // A sidebar link such as "New Leads" arrives as a filter; when it is one of the status tabs it opens that tab instead.
  const startTab = initialFilter ? TABS[slug]?.find((t) => JSON.stringify(t.where) === JSON.stringify({ [initialFilter.field]: { equals: initialFilter.value } })) : undefined;
  const [filters, setFilters] = useState<{ field: string; value: string }[]>(initialFilter && !startTab ? [initialFilter] : []);
  const [tab, setTab] = useState(startTab?.key ?? "all");
  const [sort, setSort] = useState<{ field: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(30);
  const [picked, setPicked] = useState<Set<number | string>>(new Set());
  const [cols, setCols] = useState<string[] | null>(null);
  const [panel, setPanel] = useState<"" | "filter" | "cols">("");
  const [confirm, setConfirm] = useState<(number | string)[] | null>(null);
  const [reload, setReload] = useState(0);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});

  useEffect(() => { const t = setTimeout(() => setQDebounced(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const fields = useMemo(() => (schema ? flatFields(schema.fields).filter((f) => !f.hidden) : []), [schema]);
  const admin = d.role === "admin";
  const grouped = slug === "listing-todos" && !sort;
  const byName = useMemo(() => new Map(fields.map((f) => [f.name, f])), [fields]);
  const defaultCols = useMemo(() => {
    if (!schema) return [];
    const wanted = schema.defaultColumns.filter((c) => byName.has(c));
    return wanted.length ? wanted : fields.filter((f) => ["text", "select", "number", "date", "checkbox", "email", "relationship"].includes(f.type)).slice(0, 5).map((f) => f.name!);
  }, [schema, byName, fields]);
  const shown = useMemo(() => (cols ?? defaultCols).map((n) => byName.get(n)).filter(Boolean) as SchemaField[], [cols, defaultCols, byName]);
  const titleField = schema?.useAsTitle && byName.has(schema.useAsTitle) ? schema.useAsTitle : shown[0]?.name;
  const tabs = TABS[slug];
  const activeTab = tabs?.find((t) => t.key === tab) ?? tabs?.[0];

  const where = useMemo<Where | null>(() => {
    if (!schema) return null;
    const parts: (Where | null)[] = [d.scope(slug)];
    if (qDebounced) {
      const searchable = schema.searchable.length ? schema.searchable : fields.filter((f) => f.type === "text" || f.type === "email").map((f) => f.name!).slice(0, 5);
      const ors: Where[] = searchable.filter((n) => !n.includes(".")).map((n) => ({ [n]: { like: qDebounced } }));
      if (/^\d+$/.test(qDebounced)) ors.push({ id: { equals: Number(qDebounced) } });
      if (ors.length) parts.push({ or: ors });
    }
    for (const f of filters) {
      const def = byName.get(f.field);
      parts.push({ [f.field]: { equals: def?.type === "checkbox" ? f.value === "true" : f.value } });
    }
    if (activeTab?.where) parts.push(activeTab.where);
    return allOf(...parts);
  }, [schema, d, slug, qDebounced, filters, fields, byName, activeTab]);

  // Only the columns on screen are requested, which keeps pages of 350-field records light.
  const select = useMemo(() => {
    const sel: Record<string, unknown> = {};
    for (const f of shown) {
      const [head, ...rest] = (f.name ?? "").split(".");
      if (!head) continue;
      if (rest.length) { const cur = (sel[head] as Record<string, unknown>) ?? {}; cur[rest.join(".")] = true; sel[head] = cur; } else sel[head] = true;
    }
    if (titleField && !titleField.includes(".")) sel[titleField] = true;
    if (byName.has("domain_verified")) sel.domain_verified = true;
    return sel;
  }, [shown, titleField, byName]);
  const selectKey = JSON.stringify(select);
  const whereKey = JSON.stringify(where);
  const sortParam = sort ? `${sort.dir === -1 ? "-" : ""}${sort.field}` : schema?.slug === "leads" || slug === "analytics" ? "-createdAt" : slug === "listing-todos" ? "listingName" : "-updatedAt";

  useEffect(() => {
    if (!schema) return;
    let alive = true;
    (async () => {
      try {
        const res = await apiFind(slug, { page, limit: size, sort: sortParam, where: JSON.parse(whereKey), select: JSON.parse(selectKey) });
        if (!alive) return;
        setRows(res.docs);
        setTotal(res.totalDocs);
        setError("");
        // Show names, not ids, in relationship columns.
        for (const f of shown) {
          if (f.type !== "relationship") continue;
          const byTarget = new Map<string, unknown[]>();
          for (const r of res.docs) {
            const v = getPath(r, f.name ?? "");
            for (const x of (Array.isArray(v) ? v : v == null ? [] : [v])) {
              const t = typeof x === "object" ? (x as { relationTo: string }).relationTo : f.relationTo?.[0] ?? "";
              byTarget.set(t, [...(byTarget.get(t) ?? []), typeof x === "object" ? (x as { value: unknown }).value : x]);
            }
          }
          byTarget.forEach((ids, t) => { d.ensureLabels(t, ids); });
        }
      } catch (e) {
        if (alive) { setError(e instanceof Error ? e.message : "Could not load this list."); setRows([]); setTotal(0); }
      }
    })();
    return () => { alive = false; };
    // `shown` only matters through selectKey; the label lookups run per fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, slug, page, size, sortParam, whereKey, selectKey, reload]);

  // Summary tiles and status-tab counts (same numbers and rules as /cms, see _data/list-extras.ts).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const scope = d.scope(slug);
        const [t, counts] = await Promise.all([
          loadTiles(slug, scope, d.role),
          tabs ? Promise.all(tabs.map((x) => apiCount(slug, allOf(scope, x.where)))) : Promise.resolve([] as number[]),
        ]);
        if (!alive) return;
        setTiles(t ?? []);
        setTabCounts(Object.fromEntries((tabs ?? []).map((x, i) => [x.key, counts[i]])));
      } catch { /* the strip and tabs are optional */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabs is a constant per collection
  }, [slug, d, reload]);

  const resetView = () => { setPage(1); setPicked(new Set()); };
  const onSearch = (v: string) => { setQ(v); resetView(); };
  const applyFilters = (next: { field: string; value: string }[]) => { setFilters(next); resetView(); };
  const titleOf = (collection: string, id: unknown) => d.labelOf(collection, id);

  const run = useCallback(async (ids: (number | string)[], fn: (id: number | string) => Promise<unknown>, okText: string) => {
    const results = await Promise.allSettled(ids.map(fn));
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (failed.length) d.toast(`${failed.length} of ${ids.length} failed: ${(failed[0].reason as Error)?.message ?? "not allowed"}`, "warn");
    if (failed.length < ids.length) d.toast(okText);
    setPicked(new Set());
    setConfirm(null);
    setReload((n) => n + 1);
  }, [d]);

  const duplicate = async (id: number | string) => {
    try {
      const src = await apiGet(slug, id);
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = src;
      void _id; void _c; void _u;
      if (typeof rest.slug === "string") rest.slug = `${rest.slug}-copy`;
      const copy = await apiCreate(slug, { ...rest, ...(typeof rest.isPublished === "boolean" ? { isPublished: false } : {}) });
      d.toast("Duplicated");
      router.push(`/dashboard/${slug}/${copy.id}`);
    } catch (e) { d.toast(e instanceof Error ? e.message : "Could not duplicate", "warn"); }
  };

  if (!schema) return <ListSkeleton />;
  const pages = Math.max(1, Math.ceil(total / size));
  const list = rows ?? [];
  const allOnPage = list.length > 0 && list.every((r) => picked.has(r.id));
  const filterable = fields.filter((f) => (f.type === "select" || f.type === "radio" || f.type === "checkbox") && (f.options?.length ?? 2) <= 40);
  const loading = rows === null;

  return (
    <div>
      <PageHero
        title={`${schema.label}.`}
        description={schema.description ?? (d.role === "developer" ? `Only your company's ${schema.label.toLowerCase()} are listed.` : `Everything in ${schema.label.toLowerCase()}, live from Payload.`)}
        stat={{ label: `Total ${schema.label.toLowerCase()}`, value: loading ? "…" : total.toLocaleString("en-LK") }}
        actions={<Link href={`/dashboard/${slug}/new`} className={heroBtnSolid}><Plus size={15} /> New {schema.singular.toLowerCase()}</Link>}
      />

      <div className="d-box">
        {tiles.length ? (
          <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
            {tiles.map((t) => (
              <div key={t.label} className="border border-line bg-panel px-5 py-4">
                <p className="text-[34px] font-normal leading-none tabular-nums">{t.value}</p>
                <p className="d-label mt-2">{t.label}</p>
              </div>
            ))}
          </div>
        ) : null}
        {tabs ? (
          <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={`${schema.label} status`}>
            {tabs.map((t) => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => { setTab(t.key); resetView(); }} className={`inline-flex items-center gap-2 border px-4 py-2 text-sm transition ${tab === t.key ? "border-ink bg-ink font-medium text-white" : "border-line bg-panel hover:border-fg/40"}`}>
                {t.label}<span className={`text-xs tabular-nums ${tab === t.key ? "text-white/70" : "text-muted"}`}>{tabCounts[t.key] ?? "…"}</span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="border border-line bg-panel">
          <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
            <div className="relative min-w-52 flex-1">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input value={q} onChange={(e) => onSearch(e.target.value)} placeholder={`Search ${schema.label.toLowerCase()}…`} className="w-full border border-line bg-bg py-1.5 pl-9 pr-3 text-sm outline-none focus:border-ink" />
            </div>
            <div className="relative">
              <button type="button" onClick={() => setPanel(panel === "filter" ? "" : "filter")} className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-sm hover:bg-subtle"><Filter size={14} /> Filters{filters.length ? <span className="bg-brand px-1.5 text-[10px] text-white">{filters.length}</span> : null}</button>
              {panel === "filter" ? <FilterPanel fields={filterable} onAdd={(f) => { applyFilters([...filters.filter((y) => y.field !== f.field), f]); setPanel(""); }} onClose={() => setPanel("")} /> : null}
            </div>
            <div className="relative">
              <button type="button" onClick={() => setPanel(panel === "cols" ? "" : "cols")} className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-sm hover:bg-subtle"><Columns3 size={14} /> Columns</button>
              {panel === "cols" ? (
                <div className="d-scroll absolute right-0 z-20 mt-1 max-h-72 w-60 overflow-y-auto border border-line bg-panel p-1">
                  {fields.filter((f) => !["array", "group", "richText", "textarea"].includes(f.type)).map((f) => {
                    const on = (cols ?? defaultCols).includes(f.name!);
                    return <button key={f.name} type="button" onClick={() => setCols(on ? (cols ?? defaultCols).filter((c) => c !== f.name) : [...(cols ?? defaultCols), f.name!])} className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-subtle"><Check size={14} className={on ? "text-fg" : "opacity-0"} />{f.label ?? f.name}</button>;
                  })}
                </div>
              ) : null}
            </div>
          </div>
          {filters.length ? (
            <div className="flex flex-wrap gap-1.5 border-b border-line px-3 py-2">
              {filters.map((f) => <span key={f.field} className="inline-flex items-center gap-1 bg-subtle px-2.5 py-1 text-xs">{byName.get(f.field)?.label ?? f.field}: <b>{byName.get(f.field)?.options?.find((o) => String(o.value) === f.value)?.label ?? f.value}</b><button type="button" aria-label="Remove filter" onClick={() => applyFilters(filters.filter((x) => x !== f))}><X size={12} /></button></span>)}
              <button type="button" onClick={() => applyFilters([])} className="text-xs text-muted hover:text-fg">Clear all</button>
            </div>
          ) : null}
          {picked.size ? (
            <div className="flex items-center gap-3 border-b border-line bg-accent-soft px-3 py-2 text-sm">
              <span className="font-medium">{picked.size} selected</span>
              {byName.has("isPublished") ? <button type="button" onClick={() => run([...picked], (id) => apiUpdate(slug, id, { isPublished: true }), "Published")} className="border border-line bg-panel px-2.5 py-1 text-xs font-medium hover:border-fg/40">Publish</button> : null}
              {admin && byName.has("domain_verified") ? <>
                <button type="button" onClick={() => run([...picked], (id) => apiUpdate(slug, id, { domain_verified: true, verification_status: "approved", verified_at: new Date().toISOString() }), "Approved as Verified Developer")} className="inline-flex items-center gap-1 border border-line bg-panel px-2.5 py-1 text-xs font-medium hover:border-fg/40"><BadgeCheck size={12} /> Approve as Verified Developer</button>
                <button type="button" onClick={() => run([...picked], (id) => apiUpdate(slug, id, { domain_verified: false, verified_email: null, verified_domain: null, verified_at: null }), "Verified badge removed")} className="border border-line bg-panel px-2.5 py-1 text-xs font-medium hover:border-fg/40">Remove verified</button>
              </> : null}
              <button type="button" onClick={() => setConfirm([...picked])} className="inline-flex items-center gap-1 border border-line bg-panel px-2.5 py-1 text-xs font-medium text-bad hover:border-bad"><Trash2 size={12} /> Delete</button>
              <button type="button" onClick={() => setPicked(new Set())} className="ml-auto text-xs text-muted hover:text-fg">Clear</button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="w-10 px-3 py-2.5"><input type="checkbox" aria-label="Select all on this page" checked={allOnPage} onChange={(e) => setPicked(e.target.checked ? new Set([...picked, ...list.map((r) => r.id)]) : new Set([...picked].filter((id) => !list.some((r) => r.id === id))))} /></th>
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
                {loading ? Array.from({ length: 6 }, (_, i) => <tr key={i} className="border-b border-line last:border-0"><td className="px-3 py-3"><div className="d-skeleton h-4 w-4" /></td>{shown.map((f) => <td key={f.name} className="px-3 py-3"><div className="d-skeleton h-4 w-full max-w-40" /></td>)}<td /></tr>) : list.map((r, i) => (
                  <Fragment key={String(r.id)}>
                  {grouped && (i === 0 || String(list[i - 1].listingName ?? "") !== String(r.listingName ?? "")) ? <tr className="bg-subtle"><td colSpan={shown.length + 2} className="px-3 py-2 text-sm font-semibold">{String(r.listingName || "General")} <span className="ml-1 text-xs font-normal text-muted">{list.filter((x) => String(x.listingName ?? "") === String(r.listingName ?? "")).length} to-do{list.filter((x) => String(x.listingName ?? "") === String(r.listingName ?? "")).length === 1 ? "" : "s"}</span></td></tr> : null}
                  <tr onClick={() => router.push(`/dashboard/${slug}/${r.id}`)} className="group cursor-pointer border-b border-line last:border-0 hover:bg-subtle/60">
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}><input type="checkbox" aria-label={`Select row ${r.id}`} checked={picked.has(r.id)} onChange={() => setPicked((p) => { const n = new Set(p); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} /></td>
                    {shown.map((f) => <td key={f.name} className={`px-3 py-2.5 ${f.name === titleField ? "min-w-[16rem] font-medium" : ""}`}><Cell field={f} row={r} titleOf={titleOf} /></td>)}
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <span className="flex justify-end gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                        <Link href={`/dashboard/${slug}/${r.id}`} aria-label="Edit" className="p-1.5 text-muted hover:bg-subtle hover:text-fg"><Pencil size={14} /></Link>
                        {admin && byName.has("domain_verified") ? <button type="button" aria-label={r.domain_verified ? "Remove verified" : "Approve as Verified Developer"} title={r.domain_verified ? "Remove verified" : "Approve as Verified Developer"} onClick={() => run([r.id], (id) => apiUpdate(slug, id, r.domain_verified ? { domain_verified: false, verified_email: null, verified_domain: null, verified_at: null } : { domain_verified: true, verification_status: "approved", verified_at: new Date().toISOString() }), r.domain_verified ? "Verified badge removed" : "Approved as Verified Developer")} className={`p-1.5 hover:bg-subtle ${r.domain_verified ? "text-ok hover:text-bad" : "text-muted hover:text-fg"}`}><BadgeCheck size={14} /></button> : null}
                        <button type="button" aria-label="Duplicate" onClick={() => duplicate(r.id)} className="p-1.5 text-muted hover:bg-subtle hover:text-fg"><Copy size={14} /></button>
                        <button type="button" aria-label="Delete" onClick={() => setConfirm([r.id])} className="p-1.5 text-muted hover:bg-subtle hover:text-bad"><Trash2 size={14} /></button>
                      </span>
                    </td>
                  </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>
            {error ? (
              <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                <span className="grid h-12 w-12 place-items-center bg-subtle text-bad"><AlertCircle size={22} /></span>
                <p className="font-medium">Could not load {schema.label.toLowerCase()}</p>
                <p className="max-w-sm text-sm text-muted">{error}</p>
                <button type="button" onClick={() => setReload((n) => n + 1)} className="mt-1 border border-line px-3 py-1.5 text-sm hover:bg-subtle">Try again</button>
              </div>
            ) : !loading && list.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
                <span className="grid h-12 w-12 place-items-center bg-subtle text-muted"><Inbox size={22} /></span>
                <p className="font-medium">{qDebounced || filters.length || tab !== "all" ? "Nothing matches" : `No ${schema.label.toLowerCase()} yet`}</p>
                <p className="max-w-sm text-sm text-muted">{qDebounced || filters.length || tab !== "all" ? "Try a different search or clear the filters." : `Create the first ${schema.singular.toLowerCase()} to see it here.`}</p>
                {qDebounced || filters.length || tab !== "all" ? <button type="button" onClick={() => { onSearch(""); applyFilters([]); setTab("all"); }} className="mt-1 border border-line px-3 py-1.5 text-sm">Clear search and filters</button> : <Link href={`/dashboard/${slug}/new`} className="mt-1 bg-ink px-3 py-1.5 text-sm font-medium text-white">New {schema.singular.toLowerCase()}</Link>}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm text-muted">
            <span>{total === 0 ? "0 results" : `${(page - 1) * size + 1}–${Math.min(page * size, total)} of ${total.toLocaleString("en-LK")}`}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5">Per page<select value={size} onChange={(e) => { setSize(Number(e.target.value)); resetView(); }} className="border border-line bg-panel px-1.5 py-1 text-fg">{PAGE_SIZES.map((n) => <option key={n}>{n}</option>)}</select></label>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => { setPage(page - 1); setPicked(new Set()); }} className="border border-line p-1 text-fg disabled:opacity-40"><ChevronLeft size={15} /></button>
                <span className="px-1">Page {page} / {pages}</span>
                <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => { setPage(page + 1); setPicked(new Set()); }} className="border border-line p-1 text-fg disabled:opacity-40"><ChevronRight size={15} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm border border-line bg-panel p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Delete {confirm.length} {confirm.length === 1 ? schema.singular.toLowerCase() : schema.label.toLowerCase()}?</h2>
            <p className="mt-1.5 text-sm text-muted">This deletes the real record{confirm.length === 1 ? "" : "s"} in Payload, the same as deleting in /cms. It cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="border border-line px-3 py-1.5 text-sm">Cancel</button>
              <button type="button" onClick={() => run(confirm, (id) => apiDelete(slug, id), `${confirm.length} deleted`)} className="bg-bad px-3 py-1.5 text-sm font-medium text-white">Delete</button>
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
  if (!fields.length) return <div className="absolute right-0 z-20 mt-1 w-64 border border-line bg-panel p-3 text-sm text-muted">No filterable fields in this collection.</div>;
  return (
    <div className="absolute right-0 z-20 mt-1 w-72 space-y-2 border border-line bg-panel p-3">
      <select value={field} onChange={(e) => setField(e.target.value)} className="w-full border border-line bg-panel px-2 py-1.5 text-sm">{fields.map((x) => <option key={x.name} value={x.name}>{x.label ?? x.name}</option>)}</select>
      <div className="d-scroll max-h-48 space-y-0.5 overflow-y-auto">{options.map((o) => <button key={o.value} type="button" onClick={() => onAdd({ field, value: o.value })} className="block w-full px-2 py-1.5 text-left text-sm hover:bg-subtle">{o.label}</button>)}</div>
      <button type="button" onClick={onClose} className="text-xs text-muted hover:text-fg">Close</button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <div className="d-skeleton mb-6 h-40 w-full" />
      <div className="border border-line bg-panel p-3">{Array.from({ length: 7 }, (_, i) => <div key={i} className="d-skeleton my-2 h-5 w-full" />)}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowLeft, Copy, ExternalLink, Loader2, Lock, Save, Trash2, Undo2 } from "lucide-react";
import { FieldsRenderer } from "./FieldsRenderer";
import { useDash, useGlobalSchema, useSchema } from "./DashProvider";
import { StatusChip } from "./StatusChip";
import { PageHero, heroBtn } from "./PageHero";
import { blankRow, collectErrors } from "./schema-utils";
import { ApiError, apiCreate, apiDelete, apiFind, apiGlobal, apiUpdate, apiUpdateGlobal, type Doc } from "../_data/api";
import { allOf } from "../_data/scope";
import type { FieldCtx } from "./fields/shared";
import type { Row, SchemaField } from "../_mock/types";

// One form for every collection and global: the fields come from the exported Payload schema, so the inputs, required markers,
// tabs, arrays and show/hide conditions match /cms. Saving writes to the in-memory mock store and shows a toast.


function Form({ title, kind, backHref, fields, initial, isNew, canDelete, onSave, onDelete, onDuplicate, liveUrl, statusChips }: {
  title: string;
  kind: string;
  backHref: string;
  fields: SchemaField[];
  initial: Row;
  isNew: boolean;
  canDelete: boolean;
  onSave: (row: Row) => Promise<Row>;
  onDelete?: () => Promise<void> | void;
  onDuplicate?: () => Promise<void> | void;
  liveUrl?: string;
  statusChips?: (row: Row) => { value: string; label?: string }[];
}) {
  const d = useDash();
  const router = useRouter();
  const [rec, setRec] = useState<Row>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const dirty = useMemo(() => JSON.stringify(rec) !== baseline, [rec, baseline]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const ctx: FieldCtx = { role: d.role, root: rec, sibling: rec, errors };
  const save = async () => {
    const found = collectErrors(fields, rec, [], ctx);
    setErrors(found);
    const n = Object.keys(found).length;
    if (n) { d.toast(`${n} required field${n === 1 ? "" : "s"} still empty`, "warn"); return; }
    setSaving(true);
    try {
      const saved = await onSave(rec);
      setBaseline(JSON.stringify(saved));
      setRec(saved);
      setErrors({});
      d.toast(`${kind} saved`);
      if (isNew) router.replace(`${backHref}/${saved.id}`);
    } catch (e) {
      if (e instanceof ApiError) { setErrors(e.fieldErrors); d.toast(e.message, "warn"); } else d.toast("Could not save.", "warn");
    } finally {
      setSaving(false);
    }
  };
  const chips = statusChips?.(rec) ?? [];
  const hasActivityTab = fields.some((f) => f.type === "tabs" && (f.tabs ?? []).some((t) => t.label === "Activity"));

  return (
    <div className="pb-24">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={14} /> Back to the list</Link>
      <PageHero
        title={`${isNew ? `New ${kind.toLowerCase()}` : title || `${kind} #${rec.id}`}.`}
        description={!isNew && rec.updatedAt ? `Last updated ${new Date(String(rec.updatedAt)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : "Fill in the form and save."}
        chips={chips.map((c) => <StatusChip key={c.value + (c.label ?? "")} value={c.value} label={c.label} onDark />)}
        actions={<>
          {liveUrl ? <a href={liveUrl} target="_blank" rel="noopener noreferrer" className={heroBtn}><ExternalLink size={14} /> View live</a> : null}
          {!isNew && hasActivityTab ? <button type="button" onClick={() => { window.dispatchEvent(new CustomEvent("dash:open-tab", { detail: { label: "Activity" } })); document.querySelector('[role="tablist"]')?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className={heroBtn}><Activity size={14} /> Activity</button> : null}
          {onDuplicate && !isNew ? <button type="button" onClick={onDuplicate} className={heroBtn}><Copy size={14} /> Duplicate</button> : null}
          {canDelete && !isNew ? <button type="button" onClick={() => setConfirm(true)} className={heroBtn}><Trash2 size={14} /> Delete</button> : null}
        </>}
      />

      <div className="d-box">
      <div className="rounded-xl border border-line bg-panel p-4 shadow-card sm:p-6">
        <FieldsRenderer fields={fields} data={rec} onChange={(next) => setRec(next as Row)} path={[]} ctx={ctx} />
      </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel lg:left-72">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <span className={`flex items-center gap-2 text-sm ${dirty ? "text-warn" : "text-muted"}`}>
            <span className={`h-2 w-2 rounded-full ${dirty ? "bg-warn" : "bg-ok"}`} />{dirty ? "Unsaved changes" : isNew ? "Fill in the form to create it" : "All changes saved"}
          </span>
          <span className="hidden items-center gap-1 text-xs text-muted sm:flex"><Lock size={12} /> Saves to Payload, same as /cms</span>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" disabled={!dirty} onClick={() => { setRec(JSON.parse(baseline)); setErrors({}); }} className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm hover:bg-subtle disabled:opacity-40"><Undo2 size={14} /> Discard</button>
            <button type="button" disabled={(!dirty && !isNew) || saving} onClick={save} className="inline-flex min-w-24 items-center justify-center gap-1.5 rounded-md bg-accent px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{saving ? "Saving" : "Save"}</button>
          </div>
        </div>
      </div>

      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setConfirm(false)}>
          <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold">Delete this {kind.toLowerCase()}?</h2>
            <p className="mt-1.5 text-sm text-muted">This deletes the real record in Payload, the same as in /cms. It cannot be undone.</p>
            <div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setConfirm(false)} className="rounded-md border border-line px-3 py-1.5 text-sm">Cancel</button><button type="button" onClick={async () => { setBaseline(JSON.stringify(rec)); await onDelete?.(); }} className="rounded-md bg-bad px-3 py-1.5 text-sm font-medium text-white">Delete</button></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditSkeleton() {
  return <div><div className="d-skeleton mb-5 h-7 w-64" /><div className="rounded-xl border border-line bg-panel p-6">{Array.from({ length: 8 }, (_, i) => <div key={i} className="d-skeleton my-3 h-9 w-full" />)}</div></div>;
}

const LIVE_PATH: Record<string, string> = { projects: "projects", developers: "developers", lands: "land", articles: "blog" };
const STRIP = ["id", "createdAt", "updatedAt"];
const body = (row: Row): Record<string, unknown> => Object.fromEntries(Object.entries(row).filter(([k]) => !STRIP.includes(k)));

type Loaded = { state: "loading" } | { state: "ok"; doc: Doc } | { state: "missing" } | { state: "error"; message: string };

export function CollectionEdit({ slug, id }: { slug: string; id: string }) {
  const d = useDash();
  const router = useRouter();
  const schema = useSchema(slug);
  const [loaded, setLoaded] = useState<Loaded>({ state: "loading" });
  const isNew = id === "new";

  useEffect(() => {
    if (!schema) return;
    let alive = true;
    (async () => {
      if (isNew) {
        const row = blankRow(schema.fields);
        const dev = d.session.developerIds[0];
        if (dev && slug === "projects") row.developer = dev;
        if (dev && slug === "lands") { row.sellerType = "developer"; row.seller = { relationTo: "developers", value: dev }; }
        if (alive) setLoaded({ state: "ok", doc: row });
        return;
      }
      try {
        // Looked up through the same role scope as the list, so a Developer cannot open someone else's record by changing the address.
        const res = await apiFind(slug, { limit: 1, where: allOf(d.scope(slug), { id: { equals: Number(id) } }) });
        if (alive) setLoaded(res.docs[0] ? { state: "ok", doc: res.docs[0] } : { state: "missing" });
      } catch (e) {
        if (alive) setLoaded({ state: "error", message: e instanceof Error ? e.message : "Could not load." });
      }
    })();
    return () => { alive = false; };
  }, [schema, slug, id, isNew, d]);

  if (!schema || loaded.state === "loading") return <EditSkeleton />;
  if (loaded.state !== "ok") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-lg font-semibold">{loaded.state === "error" ? "Could not open this" : "Not found"}</h1>
        <p className="mt-1.5 text-sm text-muted">{loaded.state === "error" ? loaded.message : `There is no ${schema.singular.toLowerCase()} with that id that you can open.`}</p>
        <Link href={`/dashboard/${slug}`} className="mt-4 inline-block border border-line px-3 py-1.5 text-sm">Back to {schema.label}</Link>
      </div>
    );
  }
  const found = loaded.doc as Row;
  const title = schema.useAsTitle ? String(found[schema.useAsTitle] ?? "") : "";
  return (
    <Form
      key={`${slug}-${id}`}
      title={title}
      kind={schema.singular}
      backHref={`/dashboard/${slug}`}
      fields={schema.fields}
      initial={found}
      isNew={isNew}
      canDelete={schema.access.delete !== "Admin only" || d.role === "admin"}
      onSave={async (row) => (isNew ? apiCreate(slug, body(row)) : apiUpdate(slug, id, body(row))) as Promise<Row>}
      onDelete={async () => {
        try { await apiDelete(slug, id); d.toast(`${schema.singular} deleted`); router.push(`/dashboard/${slug}`); } catch (e) { d.toast(e instanceof Error ? e.message : "Could not delete", "warn"); }
      }}
      onDuplicate={async () => {
        try {
          const copy = await apiCreate(slug, { ...body(found), ...(typeof found.slug === "string" ? { slug: `${found.slug}-copy` } : {}), ...(typeof found.isPublished === "boolean" ? { isPublished: false } : {}) });
          d.toast("Duplicated"); router.push(`/dashboard/${slug}/${copy.id}`);
        } catch (e) { d.toast(e instanceof Error ? e.message : "Could not duplicate", "warn"); }
      }}
      liveUrl={LIVE_PATH[slug] && typeof found.slug === "string" ? `https://www.lankanewhomes.com/${LIVE_PATH[slug]}/${found.slug}` : undefined}
      statusChips={(r) => [
        ...(typeof r.isPublished === "boolean" ? [{ value: r.isPublished ? "published" : "draft", label: r.isPublished ? "Published" : "Draft" }] : []),
        ...(typeof r.status === "string" && r.status ? [{ value: r.status }] : []),
        ...(r.domain_verified ? [{ value: "verified", label: "Verified Developer" }] : []),
      ]}
    />
  );
}

export function GlobalEdit({ slug }: { slug: string }) {
  const schema = useGlobalSchema(slug);
  const [doc, setDoc] = useState<Doc | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    apiGlobal(slug).then((r) => alive && setDoc(r)).catch((e) => alive && setError(e instanceof Error ? e.message : "Could not load."));
    return () => { alive = false; };
  }, [slug]);
  if (error) return <div className="mx-auto max-w-md py-20 text-center"><h1 className="text-lg font-semibold">Could not open this</h1><p className="mt-1.5 text-sm text-muted">{error}</p></div>;
  if (!schema || !doc) return <EditSkeleton />;
  return <Form key={slug} title={schema.label} kind={schema.label} backHref="/dashboard/overview" fields={schema.fields} initial={doc as Row} isNew={false} canDelete={false} onSave={async (r) => (await apiUpdateGlobal(slug, body(r))) as Row} />;
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Combobox, type ComboOption } from "../Combobox";
import { useDash } from "../DashProvider";
import { apiFind } from "../../_data/api";
import type { CollectionSchema } from "../../_mock/types";
import { FieldShell, isReadOnly, type FieldProps } from "./shared";

type Ref = number | string | { relationTo: string; value: number | string };

/** Payload relationship: a picker that searches the target collection on the server (polymorphic relations store { relationTo, value }). */
export function RelationshipField({ field, value, onChange, path, ctx, readOnly }: FieldProps<Ref | Ref[] | null>) {
  const d = useDash();
  const ro = isReadOnly(field, ctx, readOnly);
  const targets = useMemo(() => field.relationTo ?? [], [field.relationTo]);
  const poly = targets.length > 1;
  const many = Boolean(field.hasMany);
  const [target, setTarget] = useState(targets[0]);
  const [options, setOptions] = useState<ComboOption[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const list = (Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]) as Ref[];
  const plain = list.map((v) => (typeof v === "object" ? v.value : v));
  const key = JSON.stringify(list);

  // Selected records need their titles ("Prime Lands", not "#6").
  useEffect(() => {
    const byTarget = new Map<string, unknown[]>();
    for (const v of JSON.parse(key) as Ref[]) {
      const t = typeof v === "object" ? v.relationTo : targets[0];
      byTarget.set(t, [...(byTarget.get(t) ?? []), typeof v === "object" ? v.value : v]);
    }
    byTarget.forEach((ids, t) => { d.ensureLabels(t, ids); });
  }, [d, key, targets]);

  // Fetches one page of choices for the target collection (a search term narrows it by the collection's title field).
  const fetchOptions = async (q: string, t: string): Promise<ComboOption[]> => {
    const schema = (await d.ensureSchema(t)) as CollectionSchema | undefined;
    const titleField = schema?.useAsTitle && schema.useAsTitle !== "id" ? schema.useAsTitle : null;
    const scope = d.scope(t);
    const text = q.trim() && titleField ? { [titleField]: { like: q.trim() } } : null;
    const where = scope && text ? { and: [scope, text] } : (scope ?? text);
    try {
      const page = await apiFind(t, { limit: 30, where, sort: titleField ?? "-updatedAt", ...(titleField ? { select: { [titleField]: true } } : {}) });
      return page.docs.map((r) => ({ value: r.id, label: String((titleField ? r[titleField] : undefined) || `${schema?.singular ?? t} #${r.id}`), hint: poly ? schema?.singular : `#${r.id}` }));
    } catch {
      return [];
    }
  };
  const onQuery = (q: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setBusy(true);
      setOptions(await fetchOptions(q, target ?? targets[0]));
      setBusy(false);
    }, 250);
  };
  useEffect(() => {
    let alive = true;
    fetchOptions("", target ?? targets[0]).then((opts) => { if (alive) setOptions(opts); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load the first page of choices when the target collection changes
  }, [target]);

  const wrap = (v: string | number): Ref => (poly ? { relationTo: target ?? targets[0], value: v } : v);
  const labelFor = (v: string | number) => {
    const rel = list.find((x) => (typeof x === "object" ? x.value : x) === v);
    return d.labelOf(typeof rel === "object" ? rel.relationTo : targets[0], v);
  };

  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="flex gap-2">
        {poly ? (
          <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={ro} className="w-40 shrink-0 border border-line bg-panel px-2 py-2 text-sm">
            {targets.map((t) => <option key={t} value={t}>{(d.schemaOf(t) as CollectionSchema | undefined)?.singular ?? t}</option>)}
          </select>
        ) : null}
        <div className="min-w-0 flex-1">
          <Combobox
            options={options}
            value={plain}
            multiple={many}
            disabled={ro}
            loading={busy}
            remote
            onQuery={onQuery}
            labelFor={labelFor}
            placeholder={`Search ${(d.schemaOf(targets[0]) as CollectionSchema | undefined)?.label ?? targets[0]}…`}
            onChange={(next) => onChange(many ? next.map(wrap) : next[0] === undefined ? null : wrap(next[0]))}
          />
        </div>
      </div>
    </FieldShell>
  );
}

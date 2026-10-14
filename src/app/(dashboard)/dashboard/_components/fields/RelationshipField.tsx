"use client";

import { useEffect, useMemo, useState } from "react";
import { Combobox, type ComboOption } from "../Combobox";
import { useDash } from "../DashProvider";
import type { CollectionSchema } from "../../_mock/types";
import { FieldShell, isReadOnly, type FieldProps } from "./shared";

type Ref = number | string | { relationTo: string; value: number | string };

/** Payload relationship: a searchable picker over the target collection's (mock) records. Polymorphic relations store { relationTo, value }. */
export function RelationshipField({ field, value, onChange, path, ctx, readOnly }: FieldProps<Ref | Ref[] | null>) {
  const d = useDash();
  const ro = isReadOnly(field, ctx, readOnly);
  const targets = useMemo(() => field.relationTo ?? [], [field.relationTo]);
  const poly = targets.length > 1;
  const many = Boolean(field.hasMany);
  const [target, setTarget] = useState(targets[0]);
  const [, setLoaded] = useState(0);
  useEffect(() => {
    let alive = true;
    Promise.all(targets.map((t) => d.ensure(t))).then(() => alive && setLoaded((n) => n + 1));
    return () => { alive = false; };
  }, [d, targets]);

  const optionsFor = (t: string): ComboOption[] => {
    const schema = d.schemaOf(t) as CollectionSchema | undefined;
    const title = schema?.useAsTitle;
    return (d.rowsOf(t) ?? []).map((r) => ({ value: r.id, label: String((title ? r[title] : undefined) || `${schema?.singular ?? t} #${r.id}`), hint: poly ? schema?.singular : `#${r.id}` }));
  };
  const options = poly ? optionsFor(target ?? targets[0]) : optionsFor(targets[0]);
  const list = (Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]) as Ref[];
  const plain = list.map((v) => (typeof v === "object" ? v.value : v));
  const wrap = (v: string | number): Ref => (poly ? { relationTo: target ?? targets[0], value: v } : v);

  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="flex gap-2">
        {poly ? (
          <select value={target} onChange={(e) => setTarget(e.target.value)} disabled={ro} className="w-40 shrink-0 rounded-md border border-line bg-panel px-2 py-2 text-sm">
            {targets.map((t) => <option key={t} value={t}>{(d.schemaOf(t) as CollectionSchema | undefined)?.singular ?? t}</option>)}
          </select>
        ) : null}
        <div className="min-w-0 flex-1">
          <Combobox
            options={options}
            value={plain}
            multiple={many}
            disabled={ro}
            loading={options.length === 0}
            placeholder={`Search ${(d.schemaOf(targets[0]) as CollectionSchema | undefined)?.label ?? targets[0]}…`}
            onChange={(next) => onChange(many ? next.map(wrap) : next[0] === undefined ? null : wrap(next[0]))}
          />
        </div>
      </div>
    </FieldShell>
  );
}

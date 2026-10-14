"use client";

import { Plus, Trash2 } from "lucide-react";
import { FieldsRenderer } from "../FieldsRenderer";
import type { Row } from "../../_mock/types";
import { FieldShell, isReadOnly, type FieldProps } from "./shared";

/** Payload blocks. (No collection uses them today; kept so the form builder covers every Payload type.) */
export function BlocksField({ field, value, onChange, path, ctx, readOnly }: FieldProps<Row[]>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const rows = Array.isArray(value) ? value : [];
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="space-y-2">
        {rows.map((r, i) => {
          const block = (field.blocks ?? []).find((b) => b.slug === r.blockType);
          return (
            <div key={String(r.id ?? i)} className="rounded-lg border border-line bg-panel">
              <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-sm font-medium">
                {block?.label ?? String(r.blockType)}
                {ro ? null : <button type="button" aria-label="Remove block" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="text-muted hover:text-bad"><Trash2 size={14} /></button>}
              </div>
              <div className="p-3"><FieldsRenderer fields={block?.fields ?? []} data={r} onChange={(next) => onChange(rows.map((x, k) => (k === i ? (next as Row) : x)))} path={[...path, i]} ctx={ctx} readOnly={ro} /></div>
            </div>
          );
        })}
        {ro ? null : (
          <div className="flex flex-wrap gap-1.5">
            {(field.blocks ?? []).map((b) => (
              <button key={b.slug} type="button" onClick={() => onChange([...rows, { id: `blk-${Date.now()}`, blockType: b.slug }])} className="inline-flex items-center gap-1 rounded-md border border-line bg-panel px-2.5 py-1 text-xs hover:border-accent/60 hover:text-accent"><Plus size={12} /> {b.label}</button>
            ))}
          </div>
        )}
      </div>
    </FieldShell>
  );
}
